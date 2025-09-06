const path = require('path');
const express = require('express');
const multer = require('multer');

const app = express();
const PORT =  3000;

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        return cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        return cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage: storage });

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());

app.use(express.urlencoded({ extended: false }));

app.get('/', (req, res) => {
    res.render('homepage'); 
});
app.post('/upload', upload.single('profileimage'), (req, res) => {
    console.log(req.file);
    console.log(req.body); 
    return res.redirect('/');
}
);


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});