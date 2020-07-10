import '../css/qraft.css';
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

const dataDescURL = 'https://api.blended.kr/close_by_date/QRAFT_DATA_DESCRIPTION';
const dataSimURL = 'https://api.blended.kr/close_by_date/QRAFT_DATA_SIMILARITY';

const sourceDataHTML = `
<div class="source-data" id="{0}">
    <h1>{1} <span>{2}</span></h1>
    {3}
</div>
`;

const categoryHTML = `
<div class="category">
    <h2>👉 {0}</h2>
    {1}
</div>
`;

const subcategoryHTML = `
<div class="subcategory">
    <h3>{0}</h3>
    {1}
</div>
`;

const factorsHTML = `
<div class="factors">
    {0}
</div>
`;

const factorHTML = `
<div class="factor">
    <div class="name">{0}</div>
</div>  
`;

const getData = async (type) => {
    let data;
    if (type == 'desc') {
        data = await Axios.get(dataDescURL);
    } else if (type == 'sim') {
        data = await Axios.get(dataSimURL);
    }
    return data.data;
}

const main = async () => {
    const data = await getData('desc');

    let fullHTML = '';

    for (let d in data) {
        let subcat = '';
        let factorTags = '';
        let factorSection = '';
        let subcategorySection = '';
        let categorySection = '';
        for (let key in data[d]) {
            let val = data[d][key];
            if (key != 'DATA_CNT') {
                for (let v of val) {
                    if (v.length == 2) {
                        if (subcat == v[0]) {
                            factorTags += formatString(factorHTML, [v[1]]);
                        } else {
                            if (subcat != '') {
                                factorSection = formatString(factorsHTML, [factorTags]);
                                subcategorySection += formatString(subcategoryHTML, [subcat, factorSection]);
                            }
                            subcat = v[0];
                            factorTags = formatString(factorHTML, [v[1]]);
                        }
                    } else {
                        if (d != 'qraft') {
                            factorTags += formatString(factorHTML, [v]);
                        } else {
                            factorTags += formatString(factorHTML, [v.split('|')[1]]);
                        }
                    }
                }
                if (d != 'portfolio123') {
                    factorSection = formatString(factorsHTML, [factorTags]);
                    subcategorySection += formatString(subcategoryHTML, ['', factorSection]);
                    factorTags = '';
                }
                categorySection += formatString(categoryHTML, [key, subcategorySection]);
                subcategorySection = '';
            } else {
                continue
            }
        }
        fullHTML += formatString(sourceDataHTML, [META[d].title, META[d].title, data[d]['DATA_CNT'], categorySection]);
    }

    const contentSection = document.getElementsByClassName('content')[0];
    contentSection.innerHTML = fullHTML;
}

main();

const sourceCards = document.getElementsByClassName('source-btn');
for (let btn of sourceCards) {
    btn.addEventListener('click', (e) => {
        let id = btn.innerText;
        console.log(id);
        let elmnt = document.getElementById(btn.innerText);
        elmnt.scrollIntoView();
    });
}