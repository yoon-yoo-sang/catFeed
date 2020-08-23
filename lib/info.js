const express = require('express');
const router = express.Router();
const path = require('path');
const template = require('./template');
const db = require('./db.js');
const loginProcess = require('./cookie.js');
const cookie = require('cookie');
const fs = require('fs');
const multer = require('multer');
const helpers = require('./helper.js');
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'public/image/');
    },
    // By default, multer removes file extensions so let's add them back
    filename: function(req, file, cb) {
        cb(null, req.params.pageId + path.extname(file.originalname));
    }
});

router.get('/', function(req, res, next){
    db.query(`SELECT * FROM feed_age`, function(error, agelist){
    db.query(`SELECT * FROM feed_price`, function(error2, pricelist){
    if(error){next(err)};
    if(error2){next(err)};
        const title = '뭐 먹냥';
        let form = `
        <form action="/search/1" method="post" class="form-group">
            <p>연령</p>
            <p class="selectForm">
                ${template.ages(agelist, agelist[0].id)}
            </p>
            <p>가격대</p>
            <p class="selectForm">
                ${template.prices(pricelist, pricelist[0].id)}
            </p>
                <input type="submit" value="검색">
                <a href="/login">관리</a>
        </form>
        <script>init()</script>
        `;
        let list = ``;
        let script = `init()`;
        let html = template.html(title, form, list, script);
        res.send(html);
    });
    });
})

router.get('/page/:pageId', function(req, res, next){
    db.query(`SELECT * FROM feed_name LEFT JOIN feed_price ON feed_name.price_id = feed_price.id 
    LEFT JOIN feed_age ON feed_name.age_id = feed_age.id 
    LEFT JOIN company ON feed_name.company_id = company.id WHERE feed_name.id = ?`,
    [req.params.pageId], function(error, result){
        if(error){next(err)};
        const title =  `뭐 먹냥`;
        let Body = `
            <h2>${result[0].title}</h2>
            <p><image src="/image/${req.params.pageId}.png" width="150"></p>
            <p>제조업체: ${result[0].company}</p>
            <p>설명: ${result[0].description}</p>
            <p>가격대: ${result[0].price}</p>
            <p>적정 연령대: ${result[0].age}</p>
            <p>조단백 ${result[0].protein*100}% 조지방 ${result[0].fat*100}% 조회분 ${result[0].ash*100}% 조섬유 ${result[0].fiber*100}%
            수분 ${result[0].mois*100}% 칼슘 ${result[0].calcium*100}% 인 ${result[0].pho*100}%</p>
            `;
        let buttons = `
            <button id="go-back">뒤로 가기</button>
            <a href="/">다시 검색</a>
            `;
        let script = `init()`;
        let html = template.html(title, Body, buttons, script);
        res.send(html);
    });
});

router.post('/search/:pageId', function(req, res, next){
    var post = req.body;
    let showingNumber = 5;
    let limitNumber = (req.params.pageId-1) * 5;
    db.query(`SELECT * FROM feed_age WHERE id = ?`, [post.ageid], function(error, selected_age){
    db.query(`SELECT * FROM feed_price WHERE id = ?`, [post.priceid], function(error2, selected_price){
    db.query(`SELECT feed_name.id, title, description, age, price FROM feed_name LEFT JOIN feed_price ON feed_name.price_id = feed_price.id 
    LEFT JOIN feed_age ON feed_name.age_id = feed_age.id WHERE price = ? AND age = ?`,
    [selected_price[0].price, selected_age[0].age], function(error3, result){
    db.query(`SELECT feed_name.id, title, description, age, price FROM feed_name LEFT JOIN feed_price ON feed_name.price_id = feed_price.id 
    LEFT JOIN feed_age ON feed_name.age_id = feed_age.id WHERE price = ? AND age = ? LIMIT ${limitNumber}, ${(limitNumber+showingNumber)}`,
    [selected_price[0].price, selected_age[0].age], function(error4, limitedResult){
        if(error){next(err)};
        if(error2){next(err)};
        if(error3){next(err)};
        if(error4){next(err)};
        let title = '검색결과';
        let postBody = `
        <p>연령: ${selected_age[0].age}</p>
        <p>가격대: ${selected_price[0].price}</p><a href="/">다시 검색</a>
        `;
        let list = `
        ${template.list(limitedResult)}
        ${template.readMore(req, result, (limitNumber+showingNumber), '/search')}
        `
        console.log(result.length);
        console.log(limitNumber+showingNumber);
        let script = `init()`;
        let html = template.html(title, postBody, list, script);
        res.send(html);
    });
    });
    });
    });
});

router.get('/login', function(req, res){
        const title = "로그인";
        let body = `
        <form action="/login" method="post">
        <p><input type="text" name="id" placeholder="id"></p>
        <p><input type="password" name="password" placeholder="password"></p>
        <p><input type="submit"></p>
        </form>
        `;
        let list = '';
        let script = 'init()';
        let html = template.html(title, body, list, script);
        res.send(html);
})

router.post('/login', function(req, res, next){
    loginProcess.login(req, res, next, '/setting');
})

router.get('/login/Fail', function(req, res, next){
    const title = '';
    const body = '';
    const list = '';
    const script = `
    alert("잘못된 ID나 비밀번호입니다.")
    setTimeout(function () {
        window.location = "/login";
     }, 200)
    `;
    const html = template.html(title, body, list, script);
    res.send(html);
})

router.get('/setting', function(req, res){
    const title = "설정";
    let body = `
    <p><a href = "/setting/feed">사료</a></p>
    <p><a href = "/setting/form">검색 항목</a></p>
    `;
    let list = ``;
    let script = `init()`;
    let html = template.html(title, body, list, script);
    loginProcess.checkOwner(req, res, cookie, html);
});

router.get('/setting/feed', function(req, res, next){
    let dada = ``;
    if(req.query.search != undefined){
        dada = req.query.search;
    }
    db.query(`SELECT feed_name.id, title, description, price, age FROM feed_name LEFT JOIN feed_price ON feed_name.price_id = feed_price.id 
    LEFT JOIN feed_age ON feed_name.age_id = feed_age.id WHERE title LIKE "%${dada}%" ORDER BY title LIMIT 5`,
        function(err, feedlist){
        if(err){next(err)}
        const title = '사료 정보 관리'
        let body = `
            <a href="/setting/feed/create">등록</a><br>
            <a href="/">돌아가기</a>
            <p><form action="/setting/feed" method="get">
            <input type="text" name="search">
            <input type="submit" value="검색">
            </form></p>
        `
        let list = `
        ${template.settinglist(feedlist)}
        `
        let script = `
        init()
        `;
        let html = template.html(title, body, list, script)
        loginProcess.checkOwner(req, res, cookie, html);
    })
});

router.get('/setting/feed/page/:pageId', function(req, res, next){
    db.query(`SELECT * FROM feed_name LEFT JOIN feed_price ON feed_name.price_id = feed_price.id 
    LEFT JOIN feed_age ON feed_name.age_id = feed_age.id 
    LEFT JOIN company ON feed_name.company_id = company.id WHERE feed_name.id = ?`,
    [req.params.pageId], function(error, result){
        if(error){next(err)};
        console.log(result[0][`id`]);
        const title =  `뭐 먹냥`;
        let Body = `
            <h2>${result[0].title}</h2>
            <p><image src="/image/${req.params.pageId}.png" width="150"></p>
            <p>제조업체: ${result[0].company}</p>
            <p>설명: ${result[0].description}</p>
            <p>가격대: ${result[0].price}</p>
            <p>적정 연령대: ${result[0].age}</p>
            <p>조단백 ${result[0].protein*100}% 조지방 ${result[0].fat*100}% 조회분 ${result[0].ash*100}% 조섬유 ${result[0].fiber*100}%
            수분 ${result[0].mois*100}% 칼슘 ${result[0].calcium*100}% 인 ${result[0].pho*100}%</p>
            `;
        let buttons = `
            <a href="/setting/feed/update/${req.params.pageId}" class="border linkFontSize">수정</a>
            <a href="/setting/feed/update/image/${req.params.pageId}" class="border linkFontSize">이미지 등록/수정</a>
            <a href="/setting/feed" class="border linkFontSize">사료관리</a>
            <form action="/setting/feed/delete" method="post">
            <input type="hidden" name="id" value=${req.params.pageId}>
            <input type="submit" value="삭제"></form>
            `;
        let script = `init()`;
        let html = template.html(title, Body, buttons, script);
        loginProcess.checkOwner(req, res, cookie, html);
    });
});

router.get('/setting/feed/create', function(req, res){
    db.query(`SELECT * FROM feed_age`, function(error, agelist){
    db.query(`SELECT * FROM feed_price`, function(error2, pricelist){
    db.query(`SELECT * FROM company`, function(error3, companylist){
        if(error){next(err)};
        if(error2){next(err)};
        if(error3){next(err)};
        let title = `사료 등록`;
        let body = `
        <form action="/setting/feed/create/process" method="post">
            <p><label for="title">사료 이름</label>
            <input type="text" name="title"></p>
            <p><label for="description">설명</label>
            <textarea name="description"></textarea></p>
            <p><label for="companyid">회사 이름</label>
            ${template.companies(companylist, companylist[0].id)}</p>
            <p><label for="priceid">가격대</label>
            ${template.prices(pricelist, pricelist[0].id)}</p>
            <p><label for="ageid">연령대</label>
            ${template.ages(agelist, agelist[0].id)}</p>
            <p><label for="ingre">성분</label>
            <textarea name="ingre"></textarea></p>
            <p>영양</p>
            <p>
            <label for="protein">조단백</label><input type="number" name="protein" min="0" max="100" step="0.01">% 
            <label for="fat">조지방</label><input type="number" name="fat" min="0" max="100" step="0.01">% 
            <label for="ash">조회분</label><input type="number" name="ash" min="0" max="100" step="0.01">% 
            <label for="fiber">조섬유</label><input type="number" name="fiber" min="0" max="100" step="0.01">% 
            <label for="mois">수분</label><input type="number" name="mois" min="0" max="100" step="0.01">% 
            <label for="calcium">칼슘</label><input type="number" name="calcium" min="0" max="10" step="0.01">% 
            <label for="pho">인</label><input type="number" name="pho" min="0" max="10" step="0.01">% 
            </p>
            <p><input type="submit"></p>
        </form>
            `;
        let list = ``;
        let script = `init();`;
        let html = template.html(title, body, list, script);
        loginProcess.checkOwner(req, res, cookie, html);
    });
    });
    });
});

router.post('/setting/feed/create/process', function(req, res, next){
    var post = req.body;
    db.query(`INSERT INTO feed_name (title, description, company_id, price_id, age_id, ingre, protein, fat, ash, fiber, mois, calcium, pho) 
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`, [post.title, post.description, post.companyid, post.priceid, post.ageid, post.ingre, 
    post.protein/100, post.fat/100, post.ash/100, post.fiber/100, post.mois/100, post.calcium/100, post.pho/100], 
    function(err, result){
        if(err){next(err)}
        res.redirect(`/setting/feed/page/${result.InsertId}`);
    });
});

router.get('/setting/feed/update/:pageId', function(req, res, next){
    db.query(`SELECT * FROM feed_name WHERE id=?`, [req.params.pageId], function(error4, result){
    db.query(`SELECT * FROM feed_age`, function(error, agelist){
    db.query(`SELECT * FROM feed_price`, function(error2, pricelist){
    db.query(`SELECT * FROM company`, function(error3, companylist){
        if(error){next(err)};
        if(error2){next(err)};
        if(error3){next(err)};
        if(error4){next(err)};
        let title = "사료 등록";
        let body = `
            <form action="/setting/feed/update" method="post">
            <input type="hidden" name="id" value=${result[0].id}>
            <p><label for="title">사료 이름</label>
            <input type="text" name="title" value='${result[0].title}'></p>
            <p><label for="description">설명</label>
            <textarea name="description">${result[0].description}</textarea></p>
            <p><label for="companyid">회사 이름</label>
            ${template.companies(companylist, result[0].company_id)}</p>
            <p><label for="priceid">가격대</label>
            ${template.prices(pricelist, result[0].price_id)}</p>
            <p><label for="ageid">연령대</label>
            ${template.ages(agelist, result[0].age_id)}</p>
            <p><label for="ingre">성분</label>
            <textarea name="ingre">${result[0].ingre}</textarea></p>
            <p>영양</p>
            <p>
            <label for="protein">조단백</label>
            <input type="number" name="protein" min="0" max="100" step="0.01" value=${result[0].protein*100}>% 
            <label for="fat">조지방</label>
            <input type="number" name="fat" min="0" max="100" step="0.01" value=${result[0].fat*100}>% 
            <label for="ash">조회분</label>
            <input type="number" name="ash" min="0" max="100" step="0.01" value=${result[0].ash*100}>% 
            <label for="fiber">조섬유</label>
            <input type="number" name="fiber" min="0" max="100" step="0.01" value=${result[0].fiber*100}>% 
            <label for="mois">수분</label>
            <input type="number" name="mois" min="0" max="100" step="0.01" value=${result[0].mois*100}>% 
            <label for="calcium">칼슘</label>
            <input type="number" name="calcium" min="0" max="10" step="0.01" value=${result[0].calcium*100}>% 
            <label for="pho">인</label>
            <input type="number" name="pho" min="0" max="10" step="0.01" value=${result[0].pho*100}>% 
            </p>
            <p><input type="submit" value="등록"></p>
            </form>
            `;
        let list = ``;
        let script = `init()`;
        let html = template.html(title, body, list, script);
        loginProcess.checkOwner(req, res, cookie, html);
    });
    });
    });
    });
});

router.post('/setting/feed/update', function(req, res, next){
    var post = req.body;
    db.query(`UPDATE feed_name SET title=?, description=?, company_id=?, price_id=?, age_id=?, ingre=?, protein=?, fat=?, ash=?, fiber=?, mois=?, calcium=?, pho=?
        WHERE id=${post.id}`, [post.title, post.description, post.companyid, post.priceid, post.ageid, post.ingre, 
    post.protein/100, post.fat/100, post.ash/100, post.fiber/100, post.mois/100, post.calcium/100, post.pho/100], 
    function(error, result){
        if(error){next(err)}
        res.redirect(`/setting/feed/page/${post.id}`)
    });
});

router.get('/setting/feed/update/image/:pageId', function(req, res, next){
    db.query(`SELECT title FROM feed_name WHERE id=${req.params.pageId}`, function(err, result){
        if(err){throw err};
        let title = '이미지등록'
        let body = `
        <h2>${result[0].title}</h2>
        <img src="/image/${req.params.pageId}.png" width="200">
        <form method="POST" action="/setting/feed/update/image/${req.params.pageId}" enctype="multipart/form-data" id="new_document_attachment">
        <input type="file" name="image" id="document_attachment_doc">
        <p><input type="submit"></p>
        </form>
        <a href="/page/${req.params.pageId}">등록 안 함</a>
        `
        let list = ``;
        let script = `
        const form = document.getElementById("new_document_attachment");
        const fileInput = document.getElementById("document_attachment_doc");
        fileInput.addEventListener('change', () => {
        form.submit();
        });
        window.addEventListener('paste', e => {
        fileInput.files = e.clipboardData.files;
        });
        init();
        `;
        let html = template.html(title, body, list, script);
        loginProcess.checkOwner(req, res, cookie, html);
    });
})

router.post('/setting/feed/update/image/:pageId', function(req, res, next){
    let upload = multer({ storage: storage, fileFilter: helpers.imageFilter }).single('image');
    upload(req, res, function(err) {
        // req.file contains information of uploaded file
        // req.body contains information of text fields, if there were any
        if (req.fileValidationError) {
            return res.send(req.fileValidationError);
        }
        else if (!req.file) {
            return res.send('Please select an image to upload');
        }
        else if (err instanceof multer.MulterError) {
            return res.send(err2);
        }
        else if (err) {
            return res.send(error2);
        }
    res.redirect(`/setting/feed/page/${req.params.pageId}`);
    });
})

router.post('/setting/feed/delete', function(req, res, next){
    var post = req.body;
    db.query(`DELETE FROM feed_name WHERE id = ?`, [post.id],
        function(error, result){
        if(error){next(err)}
        res.redirect(`/setting/feed`);
    });
    fs.unlink(`./public/image/${post.id}.png`, function(err){
        if(err){throw err};
    })
});

router.get('/setting/form', function(req, res, next){
    db.query(`SELECT * FROM feed_age`, function(err, agelist){
    db.query(`SELECT * FROM feed_price`, function(err2, pricelist){
    db.query(`SELECT * FROM company`, function(err3, companylist){
        if(err){next(err)}
        if(err2){next(err)}
        if(err3){next(err)}
        const title = "항목 관리"
        let body = `
        <P>연령대</p>
        <form method="post">
        ${template.listChange(agelist, agelist[0].id, 'age')}
        <input type="text" name="update">
        <input type="hidden" name="listName" value="age">
        <input type="submit" formaction="/setting/form/create/feed_age" name="action" value="추가">
        <input type="submit" formaction="/setting/form/update/feed_age" name="action" value="수정">
        <input type="submit" formaction="/setting/form/delete/feed_age" name="action" value="삭제">
        </form>
        <P>가격대</p>
        <form method="post">
        ${template.listChange(pricelist, pricelist[0].id, 'price')}
        <input type="text" name="update">
        <input type="hidden" name="listName" value="price">
        <input type="submit" formaction="/setting/form/create/feed_price" name="action" value="추가">
        <input type="submit" formaction="/setting/form/update/feed_price" name="action" value="수정">
        <input type="submit" formaction="/setting/form/delete/feed_price" name="action" value="삭제">
        </form>
        <P>회사이름</p>
        <form method="post">
        ${template.listChange(companylist, companylist[0].id, 'company')}
        <input type="text" name="update">
        <input type="hidden" name="listName" value="company">
        <input type="submit" formaction="/setting/form/create/company" name="action" value="추가">
        <input type="submit" formaction="/setting/form/update/company" name="action" value="수정">
        <input type="submit" formaction="/setting/form/delete/company" name="action" value="삭제">
        </form>
        <a href="/">돌아가기</a>
        `;
        let list = ``;
        let script = `
        init();
        `;
        let html = template.html(title, body, list, script);
        res.send(html);
    });
    });
    });
})

router.post('/setting/form/create/:pageId', function(req, res, next){
    let post = req.body;
    db.query(`INSERT INTO ${req.params.pageId} (${post.listName}) VALUES ("${post.update}")`,
    function(err, result){
        if(err){next(err)};
        res.redirect('/setting/form');
    })
})

router.post('/setting/form/update/:pageId', function(req, res, next){
    let post = req.body;
    db.query(`UPDATE ${req.params.pageId} SET ${post.listName} = "${post.update}" WHERE id = ${post.selectedId}`,
    function(err, result){
        if(err){next(err)};
        res.redirect('/setting/form');
    })
})

router.post('/setting/form/delete/:pageId', function(req, res, next){
    let post = req.body;
    db.query(`DELETE FROM ${req.params.pageId} WHERE id = ${post.selectedId}`,
    function(err, result){
        if(err){next(err)};
        res.redirect('/setting/form');
    })
})

module.exports = router;