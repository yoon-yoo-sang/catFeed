module.exports = {
    back: function back(){
        document.getElementById('go-back').addEventListener('click', () => {
            window.history.back();
        });
    }
}