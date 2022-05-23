var $temp = $("<input>");
var $url = $(location).attr('href');
$(document).ready(function () {
    $('.clipboard').on('click', function () {
        $("body").append($temp);
        $temp.val($url).select();
        document.execCommand("copy");
        $temp.remove();
        $("p").text("URL copied!");
        alert("URL Copied.");
    })
});
