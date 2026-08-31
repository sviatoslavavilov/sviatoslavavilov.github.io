$("#header-js").load("/assets/snips/head.html");

$("#socials-js").load("/assets/snips/social.html");
$("#socials-js-again").load("/assets/snips/social.html");
$("#socials-js-men").load("/assets/snips/social-men.html");

$("#serhat-gallery-js").load("/assets/snips/serhat-gallery.html");


$("#description-intro-js").load("/assets/snips/description-intro.html");
$("#music-intro-js").load("/assets/snips/music-intro.html");

$("#team-list-js").load("/assets/snips/team-list.html");

function seeit() {
    $(".mobile-navigation").toggleClass("visible");
}

jQuery(document).ready(function() {
    jQuery('[data-youtube], [data-vbg]').youtube_background();
});

document.querySelector('#ytbg2').addEventListener('video-background-pause', function(){
    console.log(arguments);
});
