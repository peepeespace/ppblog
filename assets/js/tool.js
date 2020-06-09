import '../css/tool.css';
import Axios from 'axios';
import Highcharts from 'highcharts/highstock';
import Exporting from 'highcharts/modules/exporting';

Exporting(Highcharts);

Highcharts.setOptions({
  lang: {
    months: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
    shortMonths: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
    weekdays: ['월', '화', '수', '목', '금', '토', '일'],
  }
});

const drawPortHistoryChart = (seriesData) => {
  // let seriesData = [[Date.UTC(2020, 0, 1), 100], [Date.UTC(2020, 0, 2), 105], [Date.UTC(2020, 0, 3), 97]]
  Highcharts.stockChart('chart-area', {
    chart: {
      backgroundColor: '#f7f7f7',
      style: { fontFamily: 'NotoSans', },
    },
    rangeSelector: {
      inputEnabled: false,
      buttonTheme: { visibility: 'hidden', },
      labelStyle: { visibility: 'hidden', },
    },
    navigator : { enabled : false, },
    credits: { enabled: false, },
    exporting: { enabled: false, },
    scrollbar: { enabled: false, },
    title: { text: '', },
    series: [{
      name: '수익',
      data: seriesData,
      type: 'spline',
      tooltip: {
          valueDecimals: 2,
      },
      color: {
        linearGradient: {
            x1: 0,
            y1: 0,
            x2: 0,
            y2: 1,
        },
        stops: [
            [0, '#ff9cf3'],
            [0.5, '#ffaa6e'],
            [1, '#866bff'],
        ],
      },
    },],
  });
};

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
  const MONITORSTOCKURL = 'https://api.peepeespace.com/quant/monitorstock/';
  const PORTHISTORYURL = 'https://api.peepeespace.com/quant/porthistory/';
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

  const getPortHistoryData = async () => {
    const userSpecificURL = formatString(`{0}?user={1}`, [PORTHISTORYURL, ID])
    const getRes = await Axios.get(userSpecificURL, OPTIONS);
    const returnData = getRes.data.results;
  
    const records = [];
    const portfolio = {};
    const totalProfitHist = [];
    const totalProfitHistPct = [0];
    const cumProfitHist = [];
    const yieldCurve = [];
    const dateList = [];
    let chartData = [];
  
    for (let history of returnData) {
        let date = history.date;
        let stockCode = history.traded_stock;
        let action = history.action;
        let actionAmount = history.amount;
        let stockPrice = history.price;
        let avgCost = 0;
        records.push([date, stockCode, action, actionAmount, stockPrice]);
  
        if (!(stockCode in portfolio)) {
            portfolio[stockCode] = {
                'stock_cnt': 0,
                'total_amt': 0,
                'max_inv_amt': 0,
                'avg_cost': 0,
                'trade_hist': [],
                'profit_hist': [],
                'profit_hist_pct': []
            };
        }
        if ((action == 'buy') || (action == '매수')) {
            portfolio[stockCode]['stock_cnt'] += actionAmount;
            portfolio[stockCode]['total_amt'] += actionAmount * stockPrice;
            if (portfolio[stockCode]['total_amt'] > portfolio[stockCode]['max_inv_amt']) {
                portfolio[stockCode]['max_inv_amt'] = portfolio[stockCode]['total_amt'];
            }
            avgCost = (portfolio[stockCode]['stock_cnt'] == 0) ? 0 : portfolio[stockCode]['total_amt'] / portfolio[stockCode]['stock_cnt'];
            portfolio[stockCode]['avg_cost'] = avgCost;
            portfolio[stockCode]['trade_hist'].push(-1 * actionAmount * stockPrice);
        } else if ((action == 'sell') || (action == '매도')) {
            let profit = (actionAmount * stockPrice) - (actionAmount * portfolio[stockCode]['avg_cost']);
            portfolio[stockCode]['profit_hist'].push(profit);
            portfolio[stockCode]['profit_hist_pct'].push(profit / portfolio[stockCode]['max_inv_amt']);
            totalProfitHist.push(profit);
            totalProfitHistPct.push(profit / portfolio[stockCode]['max_inv_amt'])
            dateList.push(Date.UTC(date.slice(0, 4), date.slice(4, 6), date.slice(6)));
            portfolio[stockCode]['stock_cnt'] -= actionAmount;
            portfolio[stockCode]['total_amt'] -= actionAmount * stockPrice;
            avgCost = (portfolio[stockCode]['stock_cnt'] == 0) ? 0 : portfolio[stockCode]['total_amt'] / portfolio[stockCode]['stock_cnt'];
            portfolio[stockCode]['avg_cost'] = avgCost;
            portfolio[stockCode]['trade_hist'].push(actionAmount * stockPrice);
            if (portfolio[stockCode]['stock_cnt'] == 0) {
                portfolio[stockCode]['total_amt'] = 0;
            }
        }
    }
  
    totalProfitHist.reduce((prev, curr, i) => { return cumProfitHist[i] = prev + curr; }, 0);
    totalProfitHistPct.reduce((prev, curr, i) => { return yieldCurve[i] = ((i == 0) ? (1 + prev) : prev) * (1 + curr); }, 0);
    chartData = totalProfitHist.map((item, i) => { return [dateList[i], item]; });
    // console.log(returnData);
    // console.log(records);
    // console.log(portfolio);
    // console.log(totalProfitHist);
    // console.log(totalProfitHistPct);
    // console.log(cumProfitHist);
    // console.log(yieldCurve);
    // console.log(chartData);
    return [records, portfolio, totalProfitHist, totalProfitHistPct, cumProfitHist, yieldCurve, chartData];
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

  const portHistoryData = await getPortHistoryData();
  drawPortHistoryChart(portHistoryData.slice(-1)[0]);
});