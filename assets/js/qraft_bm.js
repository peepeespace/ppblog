import '../css/qraft_bm.css';
import Axios from 'axios';

const META = {
    kiwoom_eng: {
        title: 'Kiwoom'
    },
    portfolio123: {
        title: 'Portfolio123'
    },
    morningstar: {
        title: 'Morningstar'
    },
    fnguide_eng: {
        title: 'Fnguide'
    },
    qraft: {
        title: 'Qraft'
    }
};

const formatString = (stringValue, replacementsArray) => {
    let formatted = stringValue;
    for (let i = 0; i < replacementsArray.length; i += 1) {
        const regexp = new RegExp(`\\{${i}\\}`, 'gi');
        formatted = formatted.replace(regexp, replacementsArray[i]);
    }
    return formatted;
  };

const portColHTML = `
<div class="port-col">
    <div class="colname">{0}</div>
    <div class="sim-data-list">
        {1}
    </div>
</div>
`;

const simDataHTML = `
<div class="sim-data">
    <div class="compustat-name">{0}</div>
    <div class="sim-name">{1}</div>
    <div class="sim-prob">{2} %</div>
</div>
`;

const dataDescURL = 'https://api.blended.kr/close_by_date/QRAFT_DATA_DESCRIPTION';
const dataSimURL = 'https://api.blended.kr/close_by_date/QRAFT_DATA_SIMILARITY';

const skipWords = ['N', 'O', 'E'];

const getData = async (type) => {
    let data;
    if (type == 'desc') {
        data = await Axios.get(dataDescURL);
    } else if (type == 'sim') {
        data = await Axios.get(dataSimURL);
    }
    return data.data;
};

const drawSimSection = (data, dataType) => {
    let bmData = data[dataType];
    let fullHTML = '';
    for (let data in bmData) {
        let colname = data;
        let simDataSection = '';
        for (let qraftData of bmData[data]) {
            let simData;
            if (dataType == 'Portfolio123 & Qraft') {
                let compustatName = Object.keys(qraftData)[0].split('|')[0];
                let simName = Object.keys(qraftData)[0].split('|')[1];
                let simProb = (parseFloat(Object.values(qraftData)[0]) * 100).toFixed(2);
                simData = formatString(simDataHTML, [compustatName, simName, simProb]);
            } else {
                let name = Object.keys(qraftData)[0];
                let prob = (parseFloat(Object.values(qraftData)[0]) * 100).toFixed(2);
                simData = formatString(simDataHTML, [name, '', prob]);
            }
            if (!(skipWords.includes(qraftData))) {
                simDataSection += simData;
            } else {
                simDataSection += '';
            }
        }
        fullHTML += formatString(portColHTML, [colname, simDataSection]);
    }
    const columns = document.getElementsByClassName('columns')[0];
    columns.innerHTML = fullHTML;
}

const main = async () => {
    let data = await getData('sim');
    drawSimSection(data, 'Portfolio123 & Qraft');
};

main();

const applyOtherBtns = document.getElementsByClassName('apply-other-btn');
for (let btn of applyOtherBtns) {
    btn.addEventListener('click', async (e) => {
        e.preventDefault();
        let dataType = btn.innerText;
        let data = await getData('sim');
        drawSimSection(data, dataType);
    });
}