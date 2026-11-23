// usage: node render_bpmn.js in.bpmn out.svg out.png "Title"
const fs = require('fs');
const path = require('path');


(async () => {
  const puppeteer = (await import('puppeteer')).default;
  const [inp, outSvg, outPng, title] = process.argv.slice(2);
  const xml = fs.readFileSync(inp, 'utf8');
  const lib = fs.readFileSync(path.join(__dirname, 'node_modules/bpmn-js/dist/bpmn-viewer.production.min.js'), 'utf8');
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  page.on('console', m => console.log('page:', m.text()));
  await page.setContent(`<html><head><style>body{margin:0;font-family:Arial} #c{width:3200px;height:2000px}</style></head><body><div id="c"></div></body></html>`);
  await page.addScriptTag({ content: lib });
  const res = await page.evaluate(async (xml, title) => {
    const viewer = new BpmnJS({ container: '#c' });
    const { warnings } = await viewer.importXML(xml);
    // add title
    const canvas = viewer.get('canvas');
    let { svg } = await viewer.saveSVG();
    if (title) {
      svg = svg.replace(/(<svg[^>]*viewBox=")([-\d.]+) ([-\d.]+) ([-\d.]+) ([-\d.]+)("[^>]*>)/, (m, a, x, y, w, h, b) => {
        const ny = parseFloat(y) - 50, nh = parseFloat(h) + 50;
        return `${a}${x} ${ny} ${w} ${nh}${b}<text x="${parseFloat(x) + 10}" y="${ny + 32}" style="font-family:Arial;font-size:26px;font-weight:bold">${title}</text>`;
      }).replace(/width="([\d.]+)" height="([\d.]+)"/, (m, w, h) => `width="${w}" height="${parseFloat(h) + 50}"`);
    }
    return { warnings: warnings.map(w => w.message), svg };
  }, xml, title);
  if (res.warnings.length) console.log('WARNINGS:\n' + res.warnings.join('\n'));
  // white background
  const svg = res.svg.replace(/<svg([^>]*)>/, '<svg$1><rect x="-10000" y="-10000" width="30000" height="30000" fill="white"/>');
  fs.writeFileSync(outSvg, svg);
  await page.setContent(`<html><body style="margin:0;background:#fff">${svg}</body></html>`);
  const el = await page.$('svg');
  const box = await el.boundingBox();
  await page.setViewport({ width: Math.ceil(box.width), height: Math.ceil(box.height), deviceScaleFactor: 1.5 });
  await el.screenshot({ path: outPng });
  await browser.close();
  console.log('rendered', outSvg, outPng);
})().catch(e => { console.error(e); process.exit(1); });
