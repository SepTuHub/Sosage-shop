const express = require('express');
const path = require('path'); // Импортируем модуль path
const fs = require('fs');
const multer = require('multer');
const axios = require('axios');
const app = express();

// Настройка multer для хранения загруженных файлов
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'custompages/images'));
    },
    filename: (req, file, cb) => {
        const cleanedName = file.originalname.split('?')[0];
        cb(null, Date.now() + path.extname(cleanedName));
    }
});
const upload = multer({ storage: storage });

app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Для обработки JSON
app.use(express.static(__dirname)); // Обслуживание файлов из корневой директории
app.use('/custompages', express.static(path.join(__dirname, 'custompages')));


const pagesDir = path.join(__dirname, 'custompages');
const imagesDir = path.join(__dirname, 'custompages/images');

// Создаем posts.json, если его нет
const postsFile = path.join(__dirname, 'posts.json');
if (!fs.existsSync(postsFile)) {
    fs.writeFileSync(postsFile, JSON.stringify([]));
}

// Главная страница
app.get('/', (req, res) => {
    fs.readdir(pagesDir, (err, files) => {
        if (err) {
            return res.status(500).send('Ошибка при чтении файлов');
        }
        const pages = files.filter(file => file.endsWith('.html'));
        res.sendFile(path.join(__dirname, 'index.html'));
    });
});

// Обработчик для получения списка постов
app.get('/posts', (req, res) => {
    fs.readFile(postsFile, (err, data) => {
        if (err) {
            return res.status(500).send('Ошибка при чтении файла постов');
        }
        res.json(JSON.parse(data));
    });
});

// Страница создания новой страницы
app.get('/stat', (req, res) => {
    res.sendFile(path.join(__dirname, 'statCI', 'stat.html'));
});

app.post('/create', async (req, res) => {
    const { title, description, price, imageUrl } = req.body;

    if (!title || !description || !price) {
        return res.status(400).send('Title, description, and price are required');
    }

    let imageFilename = null;
    if (imageUrl) {
        try {
            const response = await axios.get(imageUrl, { responseType: 'stream' });
            const extname = path.extname(imageUrl.split('?')[0]) || '.jpg'; 
            imageFilename = Date.now() + extname;
            const imagePath = path.join(imagesDir, imageFilename);

            const writer = fs.createWriteStream(imagePath);
            response.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });
        } catch (error) {
            return res.status(500).send('Ошибка при скачивании изображения');
        }
    }

    const pageContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>${title}</title>
        <link rel="stylesheet" href="styles.css"> <!-- Подключаем общий CSS файл -->
    </head>
    <body>
        <header>
            <h1>SosageCompany</h1>
            <nav>
                <ul>
                <li><a href="../post.html">Главная</a></li>
                <li><a href="../index.html">Каталог</a></li>
                <li><a href="../contacts.html">Контакты</a></li>
                <li><a href="../statCI/stat.html">Создать пост</a></li>
                </ul>
            </nav>
        </header>
        <div class="dynamic-page">
            <h1>${title}</h1>
            ${imageFilename ? `<img src="/custompages/images/${imageFilename}" alt="${title}" />` : ''}
            <p>${description}</p>
            <p class="price">Цена: ${price} руб.</p>
        </div>
        <footer>
            <p>&copy; 2024 SosageCompany. Все права защищены.</p>
        </footer>
    </body>
    </html>`;
    
    

    fs.writeFile(path.join(pagesDir, `${title}.html`), pageContent, (err) => {
        if (err) {
            return res.status(500).send('Ошибка при создании страницы');
        }

        // Сохраняем посты в JSON
        fs.readFile(postsFile, (err, data) => {
            if (err) return res.status(500).send('Ошибка при чтении файла постов');
            const posts = JSON.parse(data);
            posts.push({ title, imageFilename, price });
            fs.writeFile(postsFile, JSON.stringify(posts), (err) => {
                if (err) return res.status(500).send('Ошибка при сохранении постов');
                res.redirect('/');
            });
        });
    });
});


// Отдача стилей и прочих статических файлов
app.use('/styles.css', express.static(path.join(__dirname, 'styles.css')));
app.use('/statCI/styles.css', express.static(path.join(__dirname, 'statCI', 'styles.css')));

// Запуск сервера
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});
