import { Cartucho } from './cartucho.model';

const encoder = new TextEncoder();

export function libroExcel(rows: Cartucho[]): Blob {
  const sheet = hoja(rows);
  return empaquetar(
    [
      { name: '[Content_Types].xml', text: TIPOS_EXCEL },
      { name: '_rels/.rels', text: RELS_EXCEL },
      { name: 'xl/workbook.xml', text: LIBRO },
      { name: 'xl/_rels/workbook.xml.rels', text: RELS_LIBRO },
      { name: 'xl/styles.xml', text: ESTILOS },
      { name: 'xl/worksheets/sheet1.xml', text: sheet },
    ],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  );
}

export function documentoWord(rows: Cartucho[]): Blob {
  return empaquetar(
    [
      { name: '[Content_Types].xml', text: TIPOS_WORD },
      { name: '_rels/.rels', text: RELS_WORD },
      { name: 'word/document.xml', text: documento(rows) },
    ],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  );
}

export function descargar(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function hoja(rows: Cartucho[]): string {
  const header = fila(1, [
    celdaTexto('A1', 'Número', 1),
    celdaTexto('B1', 'Descripción', 1),
    celdaTexto('C1', 'Precio', 1),
  ]);
  const body = rows.map((row, index) => {
    const line = index + 2;
    const precio =
      row.precio === null ? celdaVacia(`C${line}`) : celdaNumero(`C${line}`, row.precio);
    return fila(line, [
      celdaTexto(`A${line}`, row.numero, 0),
      celdaTexto(`B${line}`, row.descripcion, 0),
      precio,
    ]);
  });
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <cols>
    <col min="1" max="1" width="14" customWidth="1"/>
    <col min="2" max="2" width="72" customWidth="1"/>
    <col min="3" max="3" width="14" customWidth="1"/>
  </cols>
  <sheetData>${header}${body.join('')}</sheetData>
</worksheet>`;
}

function documento(rows: Cartucho[]): string {
  const header = filaWord(['Número', 'Descripción', 'Precio'], true);
  const body = rows.map((row) =>
    filaWord([row.numero, row.descripcion, precioTexto(row.precio)], false),
  );
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:pPr><w:spacing w:after="200"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="32"/></w:rPr><w:t>Colección de cartuchos</w:t></w:r>
    </w:p>
    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="5000" w:type="pct"/>
        <w:tblBorders>
          <w:top w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
          <w:left w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
          <w:bottom w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
          <w:right w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
          <w:insideH w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
          <w:insideV w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
        </w:tblBorders>
      </w:tblPr>
      <w:tblGrid>
        <w:gridCol w:w="1400"/>
        <w:gridCol w:w="8200"/>
        <w:gridCol w:w="1400"/>
      </w:tblGrid>
      ${header}${body.join('')}
    </w:tbl>
    <w:sectPr>
      <w:pgSz w:w="16838" w:h="11906" w:orient="landscape"/>
      <w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720" w:header="0" w:footer="0" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`;
}

function fila(index: number, cells: string[]): string {
  return `<row r="${index}">${cells.join('')}</row>`;
}

function celdaTexto(ref: string, value: string, style: number): string {
  return `<c r="${ref}" t="inlineStr" s="${style}"><is><t xml:space="preserve">${xml(value)}</t></is></c>`;
}

function celdaNumero(ref: string, value: number): string {
  return `<c r="${ref}" s="2"><v>${value.toFixed(2)}</v></c>`;
}

function celdaVacia(ref: string): string {
  return `<c r="${ref}"/>`;
}

function filaWord(values: string[], header: boolean): string {
  const cells = values
    .map((value) => {
      const mark = header ? '<w:rPr><w:b/></w:rPr>' : '';
      const shade = header ? '<w:shd w:val="clear" w:color="auto" w:fill="E2E8F0"/>' : '';
      return `<w:tc><w:tcPr>${shade}</w:tcPr><w:p><w:r>${mark}<w:t xml:space="preserve">${xml(value)}</w:t></w:r></w:p></w:tc>`;
    })
    .join('');
  return `<w:tr>${cells}</w:tr>`;
}

function precioTexto(value: number | null): string {
  if (value === null) {
    return '';
  }
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);
}

function xml(value: string): string {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function empaquetar(files: { name: string; text: string }[], type: string): Blob {
  const entries = files.map((file) => ({ name: encoder.encode(file.name), data: encoder.encode(file.text) }));
  const parts: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  for (const entry of entries) {
    const crc = crc32(entry.data);
    const local = cabeceraLocal(entry.name.length, crc, entry.data.length);
    parts.push(local, entry.name, entry.data);
    central.push(cabeceraCentral(entry.name.length, crc, entry.data.length, offset), entry.name);
    offset += local.length + entry.name.length + entry.data.length;
  }
  const centralSize = central.reduce((total, part) => total + part.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, entries.length, true);
  end.setUint16(10, entries.length, true);
  end.setUint32(12, centralSize, true);
  end.setUint32(16, offset, true);
  return new Blob([unir([...parts, ...central, new Uint8Array(end.buffer)])], { type });
}

function unir(chunks: Uint8Array[]): ArrayBuffer {
  const total = chunks.reduce((size, chunk) => size + chunk.length, 0);
  const buffer = new ArrayBuffer(total);
  const output = new Uint8Array(buffer);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.length;
  }
  return buffer;
}

function cabeceraLocal(nameLength: number, crc: number, size: number): Uint8Array {
  const view = new DataView(new ArrayBuffer(30));
  view.setUint32(0, 0x04034b50, true);
  view.setUint16(4, 20, true);
  view.setUint32(14, crc, true);
  view.setUint32(18, size, true);
  view.setUint32(22, size, true);
  view.setUint16(26, nameLength, true);
  return new Uint8Array(view.buffer);
}

function cabeceraCentral(nameLength: number, crc: number, size: number, offset: number): Uint8Array {
  const view = new DataView(new ArrayBuffer(46));
  view.setUint32(0, 0x02014b50, true);
  view.setUint16(4, 20, true);
  view.setUint16(6, 20, true);
  view.setUint32(16, crc, true);
  view.setUint32(20, size, true);
  view.setUint32(24, size, true);
  view.setUint16(28, nameLength, true);
  view.setUint32(42, offset, true);
  return new Uint8Array(view.buffer);
}

const CRC_TABLE = new Uint32Array(256);
for (let index = 0; index < 256; index += 1) {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  CRC_TABLE[index] = value >>> 0;
}

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const TIPOS_EXCEL = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`;

const RELS_EXCEL = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

const LIBRO = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="Cartuchos" sheetId="1" r:id="rId1"/></sheets>
</workbook>`;

const RELS_LIBRO = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

const ESTILOS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <numFmts count="1"><numFmt numFmtId="164" formatCode="#,##0.00 &quot;€&quot;"/></numFmts>
  <fonts count="2">
    <font><sz val="11"/><name val="Calibri"/></font>
    <font><b/><sz val="11"/><name val="Calibri"/></font>
  </fonts>
  <fills count="2">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
  </fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="3">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>
    <xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
  </cellXfs>
</styleSheet>`;

const TIPOS_WORD = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

const RELS_WORD = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;
