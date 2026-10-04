const fs = require("fs");
const JSZip = require("jszip");

// ==========================================
// XML-LEVEL TEMPLATE FILLER
// ==========================================
// The official SF10-ES workbook carries images, form-control checkboxes,
// VML and ~870 merged ranges. SheetJS (community) drops cell styling on
// write and ExcelJS drops form controls, so instead of round-tripping the
// workbook through a library this edits the sheet XML in place: only the
// <c> elements being written change, every style index, merge, drawing and
// control stays byte-for-byte as DepEd shipped it.

const escapeXml = (text) =>
    String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const unescapeXml = (text) =>
    String(text)
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&amp;/g, "&");

const columnNumber = (letters) => [...letters].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0);

const splitRef = (ref) => {
    const match = /^([A-Z]+)(\d+)$/.exec(ref);
    if (!match) throw new Error(`Invalid cell reference: ${ref}`);
    return { col: match[1], row: Number(match[2]) };
};

const buildCell = (ref, attrs, value) => {
    // Keep the template's style (s="..."); drop any old type/formula.
    const style = /\ss="(\d+)"/.exec(attrs || "");
    const styleAttr = style ? ` s="${style[1]}"` : "";

    if (typeof value === "number" && Number.isFinite(value)) {
        return `<c r="${ref}"${styleAttr}><v>${value}</v></c>`;
    }

    return `<c r="${ref}"${styleAttr} t="inlineStr"><is><t xml:space="preserve">${escapeXml(value)}</t></is></c>`;
};

const CELL_PATTERN = (ref) => new RegExp(`<c r="${ref}"(\\s[^>]*?)?(?:/>|>[\\s\\S]*?</c>)`);

const setCell = (xml, ref, value) => {
    const { col, row } = splitRef(ref);
    const rowPattern = new RegExp(`<row r="${row}"([^>]*?)(?:/>|>([\\s\\S]*?)</row>)`);
    const rowMatch = rowPattern.exec(xml);

    if (!rowMatch) {
        // Row absent: insert a new row before the first row with a higher number.
        const newRow = `<row r="${row}">${buildCell(ref, "", value)}</row>`;
        const later = [...xml.matchAll(/<row r="(\d+)"/g)].find((m) => Number(m[1]) > row);
        if (later) return xml.slice(0, later.index) + newRow + xml.slice(later.index);
        return xml.replace("</sheetData>", () => `${newRow}</sheetData>`);
    }

    const rowAttrs = rowMatch[1];
    const rowBody = rowMatch[2] ?? "";
    let newBody;
    const cellMatch = CELL_PATTERN(ref).exec(rowBody);

    if (cellMatch) {
        newBody = rowBody.replace(cellMatch[0], () => buildCell(ref, cellMatch[1], value));
    } else {
        // Cell absent: keep cells in column order within the row.
        const target = columnNumber(col);
        const later = [...rowBody.matchAll(/<c r="([A-Z]+)\d+"/g)].find((m) => columnNumber(m[1]) > target);
        const cell = buildCell(ref, "", value);
        newBody = later ? rowBody.slice(0, later.index) + cell + rowBody.slice(later.index) : rowBody + cell;
    }

    return xml.replace(rowMatch[0], () => `<row r="${row}"${rowAttrs}>${newBody}</row>`);
};

const loadTemplate = async (templatePath) => {
    const zip = await JSZip.loadAsync(fs.readFileSync(templatePath));

    const workbookXml = await zip.file("xl/workbook.xml").async("string");
    const relsXml = await zip.file("xl/_rels/workbook.xml.rels").async("string");
    const targets = new Map(
        [...relsXml.matchAll(/<Relationship [^>]*?Id="([^"]+)"[^>]*?Target="([^"]+)"/g)].map((m) => [m[1], m[2]])
    );
    const sheetPaths = new Map(
        [...workbookXml.matchAll(/<sheet [^>]*?name="([^"]+)"[^>]*?r:id="([^"]+)"/g)].map((m) => [
            unescapeXml(m[1]),
            `xl/${targets.get(m[2]).replace(/^\/?xl\//, "")}`,
        ])
    );

    const sharedXml = zip.file("xl/sharedStrings.xml") ? await zip.file("xl/sharedStrings.xml").async("string") : "";
    const sharedStrings = [...sharedXml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) =>
        unescapeXml([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join(""))
    );

    const sheetXml = new Map();
    for (const [name, path] of sheetPaths) {
        sheetXml.set(name, await zip.file(path).async("string"));
    }

    // Plain text of a template cell (shared or inline string), or null.
    const getText = (sheetName, ref) => {
        const match = CELL_PATTERN(ref).exec(sheetXml.get(sheetName) || "");
        if (!match) return null;
        const body = match[0];
        const value = /<v>([\s\S]*?)<\/v>/.exec(body);
        if (/\st="s"/.test(match[1] || "") && value) return sharedStrings[Number(value[1])] ?? null;
        const inline = [...body.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => unescapeXml(t[1])).join("");
        if (inline) return inline;
        return value ? unescapeXml(value[1]) : null;
    };

    const set = (sheetName, ref, value) => {
        if (value === null || value === undefined || value === "") return;
        if (!sheetXml.has(sheetName)) throw new Error(`Template has no sheet "${sheetName}"`);
        sheetXml.set(sheetName, setCell(sheetXml.get(sheetName), ref, value));
    };

    const toBuffer = async () => {
        for (const [name, path] of sheetPaths) zip.file(path, sheetXml.get(name));

        // Written cells lose any formula they had; drop calcChain so Excel
        // rebuilds it instead of reporting a repair, and recalc on open.
        if (zip.file("xl/calcChain.xml")) {
            zip.remove("xl/calcChain.xml");
            zip.file(
                "xl/_rels/workbook.xml.rels",
                relsXml.replace(/<Relationship [^>]*?Target="[^"]*calcChain\.xml"[^>]*?\/>/, "")
            );
            const types = await zip.file("[Content_Types].xml").async("string");
            zip.file("[Content_Types].xml", types.replace(/<Override [^>]*?calcChain\.xml"[^>]*?\/>/, ""));
        }

        let wb = workbookXml;
        wb = /<calcPr\b/.test(wb)
            ? wb.replace(/<calcPr\b([^>]*?)\/>/, (m, attrs) =>
                  /fullCalcOnLoad/.test(attrs) ? m : `<calcPr${attrs} fullCalcOnLoad="1"/>`
              )
            : wb.replace("</workbook>", '<calcPr fullCalcOnLoad="1"/></workbook>');
        zip.file("xl/workbook.xml", wb);

        return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
    };

    return { getText, set, toBuffer, sheetNames: [...sheetPaths.keys()] };
};

module.exports = { loadTemplate, setCell };
