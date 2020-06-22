const express = require('express'); // express앱 임포트하기
const path = require('path');

// 서버 포트 & 호스트 정의내려주기
const PORT = 8888;
const HOST = '0.0.0.0';

const app = express(); // 앱 시작
app.set('views', `${__dirname}/dist`); // HTML 파일 연결
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);

app.use(express.static(`${__dirname}/dist`)); // CSS 파일 연결

// 앱을 포트와 호스트와 연결하여 작동 시작하기
app.listen(PORT, HOST);
console.log(`서버가 http://${HOST}:${PORT} 에서 작동하고 있습니다.`);

app.get('/', (req, res) => {
  res.render('blog.html');
});