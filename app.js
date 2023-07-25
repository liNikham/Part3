const express = require('express');
const { google } = require('googleapis');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const credentials = require('./credentials.json');
const app = express();

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

// Initialize Google Drive API client with the service account credentials
const authClient = new google.auth.JWT({
  email: credentials.client_email,
  key: credentials.private_key,
  scopes: ['https://www.googleapis.com/auth/drive'],
});
const appDrive = google.drive({ version: 'v3', auth: authClient });

// Create an upload storage using Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Set the destination folder where files will be stored temporarily
    cb(null, 'uploads');
  },
  filename: (req, file, cb) => {
    // Set the file name to be the original name of the uploaded file
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

// Create the "uploads" folder if it doesn't exist
const uploadFolder = './uploads';
if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder);
}

// Route to render the login page (if needed)
app.get('/', (req, res) => {
  res.render('login');
});

// Route to render the file upload page
app.get('/upload', (req, res) => {
  res.render('upload');
});

// Route to handle file upload
app.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    res.status(400).send('No file uploaded.');
    return;
  }

  const fileMetadata = {
    name: req.file.originalname,
    parents: ['1HVpdB13RVlZJcMoyi6Cl1uqyLgxXNGKj'], // Replace with the actual parent folder ID
  };

  const media = {
    mimeType: req.file.mimetype,
    body: fs.createReadStream(req.file.path), // Read the file from disk
  };

  try {
    const response = await appDrive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id',
    });

    console.log('File uploaded with ID:', response.data.id);
    res.send('File uploaded successfully.');
  } catch (error) {
    console.error('Error uploading file:', error.message);
    res.status(500).send('Error uploading file.');
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
