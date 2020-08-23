module.exports = {
    login: function login(req, res, next, address){
        let post = req.body;
        if(post.id === 'yyss6188', post.password === 'ys10294!'){
            res.append('Set-Cookie', 'id=correct; Path=/setting; HttpOnly');
            res.append('Set-Cookie', 'password=correct; Path=/setting; HttpOnly');
            res.redirect(address);
        } else {
            res.redirect('/login/fail');
        }
    },
    checkOwner: function checkOwner(req, res, cookie, html){
        let cookies = {};
        cookies = cookie.parse(req.headers.cookie);
        if(req.headers.cookie === undefined){
            let html = template.html('', '잘못된 접근입니다.', '', '');
            res.send(html);
        } else {
            if(cookies.id === 'correct' && cookies.password === 'correct'){
                res.send(html);
            }
        }
    }
}