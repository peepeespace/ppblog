import '../css/login.css';
import Axios from 'axios';

window.addEventListener('load', () => {

    const getCookie = (key) => {
      const name = `${key}=`;
      const ca = document.cookie.split(';');
      for (let i = 0; i < ca.length; i += 1) {
        let c = ca[i];
        while (c.charAt(0) === ' ') {
          c = c.substring(1);
        }
        if (c.indexOf(name) === 0) {
          return c.substring(name.length, c.length);
        }
      }
      return '';
    };

    const loginURL = 'https://api.peepeespace.com/core/login/';
   
    const form = document.getElementsByClassName('login-form')[0];

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      // CORS 문제 없애기: https://velog.io/@jmkim87/%EC%A7%80%EA%B8%8B%EC%A7%80%EA%B8%8B%ED%95%9C-CORS-%ED%8C%8C%ED%97%A4%EC%B3%90%EB%B3%B4%EC%9E%90
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      const authData = {
          username,
          password,
      };
      const res = await Axios.post(loginURL, authData);
      if ('Token' in res.data) {
          console.log(res.data);
          let token = res.data.Token;
          let id = res.data.id;
          let cookieToken = getCookie('PP-PAGE-TOKEN');
          if (token == cookieToken) {
            window.location.href = '/tool';
          } else {
            document.cookie = `PP-PAGE-TOKEN=${token}`;
            document.cookie = `PP-PAGE-ID=${id}`;
            window.location.href = '/tool';
          }
      } else {
          document.getElementById('alert-area').innerText = '유저 정보가 틀렸습니다.'
      };
    });

  });