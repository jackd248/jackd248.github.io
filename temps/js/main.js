var options = {
    useEasing : true,
    useGrouping : true,
    separator : ',',
    decimal : '.',
    prefix : '',
    suffix : ''
};

/*
var lang = new Lang();
lang.dynamic('de', 'js/langpack/de.json');
lang.init({
    defaultLang: 'en'
});
*/

(function() {
    var githubapi = "https://api.github.com/repos/jackd248/temps/releases";
    var count = 0;
    $.getJSON( githubapi, {})
        .done(function( data ) {
            $.each( data, function( key, val ) {
                $.each( val.assets, function( i, j ) {
                    count += j.download_count;
                });
            });
            var numbers = new CountUp("count", 0, count, 0, 4.5, options);
            numbers.start();
        })
        .fail(function() {
            $('.download-count').hide();
        })
        .always(function() {
            if (count == 0) {
                $('.download-count').hide();
            }
        });
})();

/*
function changeLanguage() {
    var myselect = document.getElementById("languageSelect");
    window.lang.change(myselect.options[myselect.selectedIndex].value);
}
*/

