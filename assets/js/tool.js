import '../css/tool.css';
import '../fontawesome/css/fontawesome.min.css';
import Axios from 'axios';
// import Highcharts from 'highcharts';

// require('highcharts/modules/exporting')(Highcharts);

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

const formatString = (stringValue, replacementsArray) => {
  let formatted = stringValue;
  for (let i = 0; i < replacementsArray.length; i += 1) {
      const regexp = new RegExp(`\\{${i}\\}`, 'gi');
      formatted = formatted.replace(regexp, replacementsArray[i]);
  }
  return formatted;
};

window.addEventListener('load', async () => {

  const TOKEN = getCookie('PP-PAGE-TOKEN');
  const ID = getCookie('PP-PAGE-ID');
  const MONITORSTOCKURL = 'http://api.peepeespace.com/quant/monitorstock/';
  const OPTIONS = {
    headers: {'Authorization': `Token ${TOKEN}`}
  };

  let toolState;
  let formSectionOpen = 0;
  const formSection = document.getElementById('form-section');
  const actionBtns = document.getElementsByClassName('action-btn');
  const monitorstocksSection = document.getElementById('monitorstocks');

  const formHTML = `
  <form>
    <input id="code-list" type="text" name="code-list" placeholder="000020,000030,005930과 같은 형식으로 제출" />
    <input type="submit">
  </form>
  {0}
  `;

  const formErrorHTML = `<p>코드는 000000의 형식입니다! 다시 확인해주세요.</p>`;

  const monitorstocksHTML = `
  <div class="monitorstocks-tag">
    <h2>{0} 관심종목 🧑‍💻</h2>
    {1}
    <p>잘못된 종목이 있다면 다시 담아주기 바랍니다.</p>
  </div>
  `;

  const tagHTML = `<div class="tag">{0}</div>`;

  const formatTagSection = (rawDate, rawCodeList) => {
    if (typeof rawCodeList == 'string') {
      rawCodeList = rawCodeList.split(',');
    }

    let tagsHTML = '';
    if (rawCodeList != '') {
      for (let code of rawCodeList) {
        tagsHTML += formatString(tagHTML, [code]);
      }
    }

    const monitorstocksTagHTML = formatString(monitorstocksHTML, [rawDate, tagsHTML]);
    monitorstocksSection.innerHTML = monitorstocksTagHTML;
  };

  const postCodeListData = async (codeList) => {
    // POST request section
    let today = new Date().toISOString().slice(0,10);
    today = today.replace('-', '').replace('-', '');
    let params = {
      'date': today,
      'codelist': codeList.join(),
      'user': ID
    };
    await Axios.post(MONITORSTOCKURL, params, OPTIONS);
  };

  const getCodeListData = async () => {
    const userSpecificURL = formatString(`{0}?user={1}`, [MONITORSTOCKURL, ID])
    const getRes = await Axios.get(userSpecificURL, OPTIONS);
    const returnData = getRes.data.results.pop();
    return returnData;
  };

  const updateCodeListData = async (codeListJSON, newDataJSON) => {
    const dataID = codeListJSON['id'];
    const jsonData = codeListJSON;
    delete jsonData['created'];
    delete jsonData['updated'];
    for (let key of Object.keys(newDataJSON)) {
      jsonData[key] = newDataJSON[key];
    }
    const dataSpecificURL = formatString(`{0}{1}/`, [MONITORSTOCKURL, dataID]);
    await Axios.put(dataSpecificURL, jsonData, OPTIONS);
  };

  // prepare page on page load
  const codeListData = await getCodeListData();
  if (typeof codeListData != 'undefined') {
    let date = codeListData['date'];
    let rawCodeList = codeListData['codelist'];
    formatTagSection(date, rawCodeList);
  }

  for (let i = 0 ; i < actionBtns.length; i++) {
    actionBtns[i].addEventListener('click', (e) => {
      let btnText = actionBtns[i].innerText;
      if (btnText == '툴시작') {
        let toolStateArea = document.getElementById('want-state');
        toolState = toolStateArea.innerText;
        if (toolState != '1') {
          toolStateArea.innerText = '1';
        } else {
          toolStateArea.innerText = '0';
        }
      } else {
        if (formSectionOpen == 0) {
          formSection.innerHTML = formatString(formHTML, ['']);
          formSectionOpen = 1;
        } else {
          formSection.innerHTML = '';
          formSectionOpen = 0;
        }
      }
    });
  }

  formSection.addEventListener('submit', async (event) => {
    event.preventDefault();

    let errorExists = 0;

    let today = new Date().toISOString().slice(0,10);
    today = today.replace('-', '').replace('-', '');
    const codeListJSON = await getCodeListData();
    
    let rawCodeList = document.getElementById('code-list').value;
    if (rawCodeList == '') {
      formatTagSection(today, '');
      await updateCodeListData(codeListJSON, {'date': today, 'codelist': '-'});
    } else {
      rawCodeList = rawCodeList.split(',');

      const codeList = [];
      for (let code of rawCodeList) {
        let trimCode = code.trim();
        if ((trimCode.length != 6) || (isNaN(Number(trimCode)))) {
          errorExists = 1;
          formSection.innerHTML = formatString(formHTML, [formErrorHTML]);
        } else {
          codeList.push(trimCode);
        }
      }
  
      if (errorExists == 0) {
        formatTagSection(today, codeList);
        if (typeof codeListJSON != 'undefined') {
          await updateCodeListData(codeListJSON, {'date': today, 'codelist': rawCodeList.join()});
        } else{
          await postCodeListData(rawCodeList.join());
        }
      }
    }
  });

});

// const drawTextFreqDonutChart = () => {
//   // 차트 부분 보이도록 하기
//   const container = document.getElementById('chart-area');
//   container.style.display = 'block';

//   const chart = new Highcharts.Chart({
//     chart: {
//       renderTo: 'chart-area',
//       backgroundColor: '#f7f7f7',
//       plotBackgroundColor: '#f7f7f7',
//       plotBorderWidth: null,
//       plotShadow: false,
//       type: 'pie',
//     },
//     title: {
//       text: '',
//       style: {
//         color: '#3F3F3F',
//         fontSize: '18px',
//         fontWeight: 'bold',
//       },
//     },
//     subtitle: {
//       text: '',
//       style: {
//         display: 'none',
//       },
//     },
//     exporting: {
//       enabled: false,
//     },
//     credits: {
//       enabled: false,
//     },
//     tooltip: {
//       // pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>',
//       pointFormat: '{series.name}: <b>{point.y}</b>',
//     },
//     plotOptions: {
//       pie: {
//         allowPointSelect: true,
//         cursor: 'pointer',
//         innerSize: '60%',
//         dataLabels: {
//           enabled: true,
//           format: '<b>{point.name}</b>: {point.percentage:.1f} %',
//           style: {
//             color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black',
//           },
//         },
//       },
//     },
//     series: [{
//       name: '단어 빈도수',
//       colorByPoint: true,
//       // data: freqData,
//       data: [{
//         name: 'Chrome',
//         y: 61.41,
//         sliced: true,
//         selected: true,
//       }, {
//         name: 'Internet Explorer',
//         y: 11.84,
//       }, {
//         name: 'Firefox',
//         y: 10.85,
//       }, {
//         name: 'Edge',
//         y: 4.67,
//       }, {
//         name: 'Safari',
//         y: 4.18,
//       }, {
//         name: 'Sogou Explorer',
//         y: 1.64,
//       }, {
//         name: 'Opera',
//         y: 1.6,
//       }, {
//         name: 'QQ',
//         y: 1.2,
//       }, {
//         name: 'Other',
//         y: 2.61,
//       }],
//     }],
//     // using
//     function() { // on complete
//       const xpos = '50%';
//       const ypos = '53%';
//       const circleradius = 102;
//       // Render the circle
//       chart.renderer.circle(xpos, ypos, circleradius).attr({
//         fill: '#27314f',
//       }).add();
//     },
//   });
// };