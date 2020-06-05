const express = require('express'); // express앱 임포트하기
const path = require('path');

// 서버 포트 & 호스트 정의내려주기
const PORT = 8080;
const HOST = '0.0.0.0';

const app = express(); // 앱 시작
app.set('views', `${__dirname}/dist`); // HTML 파일 연결
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);

app.use(express.static(`${__dirname}/dist`)); // CSS 파일 연결

// 앱을 포트와 호스트와 연결하여 작동 시작하기
app.listen(PORT, HOST);
console.log(`서버가 http://${HOST}:${PORT} 에서 작동하고 있습니다.`);

// //////////////////////////
// // URL 정의는 여기서 부터 ////
// /////////////////////////

// 여기부터는 프론트엔드 개발자의 창의력을 보여주세요~! //

// app.get함수에 들어가는 것은 첫 번째 인자: URL 정의입니다
// 두 번째 인자는 디폴트로 (req, res)라고 두고 텍스트를 보여주고 싶으면, res.send를
// html을 보내고 싶으면, res.render함수를 사용합니다.

// 메인 페이지: https://www.buzzz.co.kr/
app.get('/', (req, res) => {
  res.render('login.html');
});

app.get('/tool', (req, res) => {
  res.render('tool.html');
});

app.get('/history', (req, res) => {
  res.render('history.html');
});

// app.get('/blog', (req, res) => {
//   res.render('blog_detail.html');
// });
// // 마켓시그널 페이지: https://www.buzzz.co.kr/marketsignal/
// app.get('/marketsignal', (req, res) => {
//   res.render('market_signal.html');
// });