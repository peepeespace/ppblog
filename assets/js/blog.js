import '../css/blog.css';
import Axios from 'axios';
import Prism from 'prismjs';
import 'prismjs/components/prism-python.js';
import 'prismjs/components/prism-markup.js';

const blogURL = 'https://api.blended.kr/close_by_date/blog_entry_1';

const blogHTML = `
<div class="blog-entry">
    <div class="category">{0}</div>
    <div class="title">{1}</div>
    <div class="subtitle">{2}</div>
    <div class="summary">{3}</div>
    <div class="actions"></div>
    <div class="content">{4}</div>
</div>
`

const formatString = (stringValue, replacementsArray) => {
    let formatted = stringValue;
    for (let i = 0; i < replacementsArray.length; i += 1) {
        const regexp = new RegExp(`\\{${i}\\}`, 'gi');
        formatted = formatted.replace(regexp, replacementsArray[i]);
    }
    return formatted;
  };

const main = async () => {
    let blogContentHTML = '';
    const blogJSON = await Axios.get(blogURL);
    blogContentHTML += formatString(blogHTML, [
        blogJSON.data['category'],
        blogJSON.data['title'],
        blogJSON.data['subtitle'],
        blogJSON.data['summary'],
        blogJSON.data['content']
    ]);

    const blogListSection = document.getElementsByClassName('list')[0];
    blogListSection.innerHTML = blogContentHTML;
};

window.addEventListener('load', async () => {
    await main();
  
    const prismSection = document.getElementsByClassName('language-python')[0];
    // Prism.highlightAllUnder(prismSection);
    Prism.highlightAll();
});