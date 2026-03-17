const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('Usage: node scripts/generate_docx_from_markdown.js <input.md> <output_dir> [title]');
  process.exit(1);
}

const inputPath = path.resolve(rootDir, args[0]);
const outputDir = path.resolve(rootDir, args[1]);
const documentTitle = args[2] || path.basename(inputPath, path.extname(inputPath));

const xmlEscape = (value) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const deleteDir = (target) => {
  if (!fs.existsSync(target)) return;
  for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
    const entryPath = path.join(target, entry.name);
    if (entry.isDirectory()) {
      deleteDir(entryPath);
    } else {
      fs.unlinkSync(entryPath);
    }
  }
  fs.rmdirSync(target);
};

const ensureDir = (target) => {
  fs.mkdirSync(target, { recursive: true });
};

const paragraphXml = (text, style = 'BodyText', options = {}) => {
  const lines = String(text).split(/\r?\n/);
  const runs = lines
    .map((line, index) => {
      const textXml = line.length === 0 ? '<w:t xml:space="preserve"> </w:t>' : `<w:t xml:space="preserve">${xmlEscape(line)}</w:t>`;
      const breakXml = index < lines.length - 1 ? '<w:br/>' : '';
      const runProps = options.bold ? '<w:rPr><w:b/></w:rPr>' : '';
      return `<w:r>${runProps}${textXml}${breakXml}</w:r>`;
    })
    .join('');

  const pageBreak = options.pageBreakBefore ? '<w:pageBreakBefore/>' : '';
  const spacing = options.tight ? '<w:spacing w:after="60"/>' : '';

  return `<w:p><w:pPr><w:pStyle w:val="${style}"/>${pageBreak}${spacing}</w:pPr>${runs}</w:p>`;
};

const bulletXml = (text) => `<w:p><w:pPr><w:pStyle w:val="BodyText"/></w:pPr><w:r><w:t xml:space="preserve">- ${xmlEscape(text)}</w:t></w:r></w:p>`;

const buildParagraphs = (markdown) => {
  const lines = markdown.split(/\r?\n/);
  const paragraphs = [];
  let buffer = [];
  let firstTitle = true;

  const flushBuffer = () => {
    if (buffer.length === 0) return;
    paragraphs.push(paragraphXml(buffer.join(' '), 'BodyText'));
    buffer = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (!line.trim()) {
      flushBuffer();
      continue;
    }

    if (line === '---') {
      flushBuffer();
      paragraphs.push(paragraphXml('', 'BodyText'));
      continue;
    }

    if (line.startsWith('### ')) {
      flushBuffer();
      paragraphs.push(paragraphXml(line.slice(4), 'Heading2'));
      continue;
    }

    if (line.startsWith('## ')) {
      flushBuffer();
      paragraphs.push(paragraphXml(line.slice(3), 'Heading1'));
      continue;
    }

    if (line.startsWith('# ')) {
      flushBuffer();
      paragraphs.push(paragraphXml(line.slice(2), 'Title', { pageBreakBefore: !firstTitle }));
      firstTitle = false;
      continue;
    }

    if (line.startsWith('- ')) {
      flushBuffer();
      paragraphs.push(bulletXml(line.slice(2)));
      continue;
    }

    if (/^Date:|^Version:|^Statut:/.test(line)) {
      flushBuffer();
      paragraphs.push(paragraphXml(line, 'BodyText', { tight: true, bold: true }));
      continue;
    }

    buffer.push(line.trim());
  }

  flushBuffer();
  paragraphs.push('<w:p/>');

  return paragraphs.join('');
};

const documentXml = (bodyXml) => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:w10="urn:schemas-microsoft-com:office:word" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup" xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk" xmlns:wne="http://schemas.microsoft.com/office/2006/wordml" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape" mc:Ignorable="w14 wp14">
  <w:body>
    ${bodyXml}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="708" w:footer="708" w:gutter="0"/>
      <w:cols w:space="708"/>
      <w:docGrid w:linePitch="360"/>
    </w:sectPr>
  </w:body>
</w:document>`;

const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Aptos" w:hAnsi="Aptos" w:eastAsia="Aptos" w:cs="Aptos"/>
        <w:sz w:val="22"/>
        <w:szCs w:val="22"/>
        <w:lang w:val="fr-FR"/>
      </w:rPr>
    </w:rPrDefault>
    <w:pPrDefault>
      <w:pPr>
        <w:spacing w:after="140" w:line="300" w:lineRule="auto"/>
      </w:pPr>
    </w:pPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:qFormat/>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Title">
    <w:name w:val="Title"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="BodyText"/>
    <w:uiPriority w:val="10"/>
    <w:qFormat/>
    <w:pPr>
      <w:spacing w:before="240" w:after="220"/>
    </w:pPr>
    <w:rPr>
      <w:b/>
      <w:color w:val="1F4E79"/>
      <w:sz w:val="34"/>
      <w:szCs w:val="34"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="Heading 1"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="BodyText"/>
    <w:uiPriority w:val="9"/>
    <w:qFormat/>
    <w:pPr>
      <w:spacing w:before="260" w:after="120"/>
    </w:pPr>
    <w:rPr>
      <w:b/>
      <w:color w:val="17365D"/>
      <w:sz w:val="28"/>
      <w:szCs w:val="28"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="Heading 2"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="BodyText"/>
    <w:uiPriority w:val="9"/>
    <w:qFormat/>
    <w:pPr>
      <w:spacing w:before="180" w:after="80"/>
    </w:pPr>
    <w:rPr>
      <w:b/>
      <w:color w:val="365F91"/>
      <w:sz w:val="24"/>
      <w:szCs w:val="24"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="BodyText">
    <w:name w:val="Body Text"/>
    <w:basedOn w:val="Normal"/>
    <w:qFormat/>
    <w:pPr>
      <w:jc w:val="both"/>
      <w:spacing w:after="120" w:line="320" w:lineRule="auto"/>
    </w:pPr>
    <w:rPr>
      <w:color w:val="222222"/>
    </w:rPr>
  </w:style>
</w:styles>`;

const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`;

const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`;

const documentRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>`;

const nowIso = new Date().toISOString();

const coreXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>${xmlEscape(documentTitle)}</dc:title>
  <dc:subject>${xmlEscape(documentTitle)}</dc:subject>
  <dc:creator>OpenAI Codex</dc:creator>
  <cp:keywords>FinanceME,Candidature,Projet</cp:keywords>
  <dc:description>${xmlEscape(documentTitle)}</dc:description>
  <cp:lastModifiedBy>OpenAI Codex</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">${nowIso}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">${nowIso}</dcterms:modified>
</cp:coreProperties>`;

const appXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Microsoft Office Word</Application>
  <DocSecurity>0</DocSecurity>
  <ScaleCrop>false</ScaleCrop>
  <HeadingPairs>
    <vt:vector size="2" baseType="variant">
      <vt:variant><vt:lpstr>Title</vt:lpstr></vt:variant>
      <vt:variant><vt:i4>1</vt:i4></vt:variant>
    </vt:vector>
  </HeadingPairs>
  <TitlesOfParts>
    <vt:vector size="1" baseType="lpstr">
      <vt:lpstr>${xmlEscape(documentTitle)}</vt:lpstr>
    </vt:vector>
  </TitlesOfParts>
  <Company>FinanceME</Company>
  <LinksUpToDate>false</LinksUpToDate>
  <SharedDoc>false</SharedDoc>
  <HyperlinksChanged>false</HyperlinksChanged>
  <AppVersion>16.0000</AppVersion>
</Properties>`;

const markdown = fs.readFileSync(inputPath, 'utf8');
const bodyXml = buildParagraphs(markdown);

deleteDir(outputDir);
ensureDir(path.join(outputDir, '_rels'));
ensureDir(path.join(outputDir, 'docProps'));
ensureDir(path.join(outputDir, 'word', '_rels'));

fs.writeFileSync(path.join(outputDir, '[Content_Types].xml'), contentTypesXml, 'utf8');
fs.writeFileSync(path.join(outputDir, '_rels', '.rels'), rootRelsXml, 'utf8');
fs.writeFileSync(path.join(outputDir, 'docProps', 'core.xml'), coreXml, 'utf8');
fs.writeFileSync(path.join(outputDir, 'docProps', 'app.xml'), appXml, 'utf8');
fs.writeFileSync(path.join(outputDir, 'word', 'document.xml'), documentXml(bodyXml), 'utf8');
fs.writeFileSync(path.join(outputDir, 'word', 'styles.xml'), stylesXml, 'utf8');
fs.writeFileSync(path.join(outputDir, 'word', '_rels', 'document.xml.rels'), documentRelsXml, 'utf8');

console.log(`DOCX package generated in ${outputDir}`);
