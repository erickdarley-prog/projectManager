const File = require('./file.model');

async function uploadFile(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    const { originalname, mimetype, size, path: storedPath } = req.file;
    const normalizedPath = storedPath.replace(/\\/g, '/');

    const doc = await File.create({
      name: originalname,
      type: mimetype,
      size,
      path: normalizedPath,
      // uploadedAt será preenchido automaticamente
    });

    return res.status(201).json(doc);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao fazer upload do arquivo' });
  }
}

module.exports = { uploadFile };
