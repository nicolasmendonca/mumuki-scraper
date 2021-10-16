const puppeteer = require("puppeteer");

function sanitizarTexto(str) {
  str = str.replace(/^\s+|\s+$/g, ""); // trim
  str = str.toLowerCase();

  let from = "àáäâèéëêìíïîòóöôùúüûñç·/_,:;";
  let to = "aaaaeeeeiiiioooouuuunc------";
  for (let i = 0, l = from.length; i < l; i++) {
    str = str.replace(new RegExp(from.charAt(i), "g"), to.charAt(i));
  }

  str = str
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  return str;
}

function pad(num, size) {
  let s = "000000000" + num;
  return s.substr(s.length - size);
}

const cookies = [
  // Aca van las cookies de la autenticación
];

async function bajarPdfs() {
  // Abrir el navegador
  let navegador = await puppeteer.launch({
    // headless: false,
    // slowMo: 250
  });
  let pestanias = await navegador.pages();
  let primerPestania = pestanias[0];

  await primerPestania.goto("https://mumuki.io");
  await primerPestania.setCookie(...cookies);
  await primerPestania.goto(
    "https://mumuki.io/argentina-programa/chapters/530-fundamentos", // Aca va el link del modulo (en este caso JS)
    { waitUntil: "networkidle2" }
  );

  // Agarrar todos los links del modulo
  const links = await primerPestania.$$(
    ".progress-listing li > a:nth-child(2)"
  );

  let contador = 1;
  for (let link of links) {
    let paginaDelEjercicio = await navegador.newPage();
    const linkDelEjercicio = await (await link.getProperty("href")).jsonValue();
    const nombreDelEjercicio = await (
      await link.getProperty("innerText")
    ).jsonValue();
    await paginaDelEjercicio.goto(linkDelEjercicio, {
      waitUntil: "networkidle2",
      timeout: 1000 * 60, // 1 minute
    });
    await paginaDelEjercicio.pdf({
      path:
        "pdfs/" +
        pad(contador, 3) +
        "-" +
        sanitizarTexto(nombreDelEjercicio) +
        ".pdf",
      format: "a4",
    });
    await paginaDelEjercicio.close();
    contador++;
  }

  navegador.close();
}

bajarPdfs();
