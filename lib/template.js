module.exports = {
    html: function(title, body, list, script) {
      //문서 만들기
      return `
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <link href="/css/bootstrap.css" rel="stylesheet" type="text/css">
        <link href="/main.css" rel="stylesheet" >
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR&display=swap" rel="stylesheet">
        <script src="/static.js"></script>
      </head>
      <body class="container mt-3">
        <h1>${title}</h1>
        ${body}
        ${list}
        <script>${script}</script>
      </body>
      </html>
      `;
    },list: function(result){
        let list = ``;
        if(result.length > 0){
            for(i = 0; i < result.length; i++){
                list = list + `<p>
                <h4>${result[i].title}</h4>${result[i].description}<br>
                <a href="/page/${result[i].id}">자세히 보기</a>
                </p>`
            };
        } else {
            list = '<p>검색 결과 없음</p>';
        }
        return list;
    },species: function(result){
        let list = `<select name = "species">`;
        for(i = 0; i < result.length; i++){
            list = list + `<option value="${result[i].name}">${result[i].name}</option>`
        };
        list = list + `</select>`;
        return list;
    },ages: function(agelist, popo){
        let list = ``;
        for(i = 0; i < agelist.length; i++){
            let checked = ``;
            if(agelist[i].id === popo){
                checked = ` checked`;
            }
            list = list + `<input type="radio" name="ageid" value="${agelist[i].id}"${checked}>
            ${agelist[i].age}`;
        }
        return list;
    },prices: function(pricelist, popo){
        let list = ``
        for(i = 0; i < pricelist.length; i++){
            let checked = ``;
            if(pricelist[i].id === popo){
                checked = ` checked`;
            }
            list = list + `<input type="radio" name="priceid" value="${pricelist[i].id}"${checked}>
            <label for="${pricelist[i].id}">${pricelist[i].price}(1kg/${pricelist[i].criteria})</label>`
        }
        return list;
    },companies: function(companylist, popo){
        let list = `<select name = "companyid">`
        for(i = 0; i < companylist.length; i++){
            let selected = ``
            if(companylist[i].id === popo){
                selected = ` selected`
            }
            list = list + `<option value="${companylist[i].id}"${selected}>${companylist[i].company}</option>`
        }
        list = list + `</select>`
        return list;
    },listChange: function(result, selectedOption, listName){
        let list = `<select name = "selectedId" id="${listName}Id">`
        for(i = 0; i < result.length; i++){
            let selected = ``;
            let columnName = result[i][`${listName}`];
            if(result[i].id === selectedOption){
                selected = ` selected`;
            }
            list = list + `<option id="${listName}${result[i].id}" 
            value="${result[i].id}"${selected}>${columnName}</option>`;
        }
        list = list + `</select>`
        return list;
    },settinglist: function(feedlist){
            let list = ``;
            for(i = 0; i < feedlist.length; i++){
                list = list + `
                <p>
                <h3><a href="/setting/feed/page/${feedlist[i].id}" class="h3">${feedlist[i].title}</a></h3>
                설명: ${feedlist[i].description}<br>
                가격대: ${feedlist[i].price} <br>
                적정 연령대: ${feedlist[i].age}
                <br><a href="/setting/feed/update/${feedlist[i].id}" class="border linkFontSize">수정</a>
                <a href="/setting/feed/update/image/${feedlist[i].id}" class="border linkFontSize">이미지 등록/수정</a>
                <form action="/setting/feed/delete" method="post">
                <input type="hidden" name="id" value=${feedlist[i].id}>
                <input type="submit" value="삭제"></form>
                </p>`
            };
            return list
    },readMore: function(req, result, lastnumber, address){
        let readMoreButton = ``;
        if(lastnumber < result.length){
        readMoreButton = `<a href="${address}/${(req.params.pageId*1)+1}">다음페이지</a>`
        }
        return readMoreButton;
    }
    }