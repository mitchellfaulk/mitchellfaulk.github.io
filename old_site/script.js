$(document).ready(function() {
    $(".hide").hide();
    $("#horizontal li").hover(function(){
        $(this).toggleClass("highlight");
        $(this).css( 'cursor', 'pointer' );
    });
    $("span").hover(function(){
        $(this).toggleClass("highlight");
    });
    $("#name").click(function(){
        $(".hide").hide();
        $("body").css("background-color","#0099e8");
    });
    $("#name").hover(function(){
        $(this).css("cursor","pointer");
    });
    $("#about").click(function(){
        $(".hide").hide();
        $("#about_div").show();
    });
    $("#teaching").click(function(){
        $(".hide").hide();
        $("#teaching_div").show();
    });
    $("#research").click(function(){
        $(".hide").hide();
        $("#research_div").show();
    });
    $("#notes").click(function(){
        $(".hide").hide();
        $("#notes_div").show();
    });
    $("span").hover(function(){
        $(this).css( 'cursor', 'pointer' );
    });
    $("#exact_results_but").click(function(){
        $("#exact_results_abs").show();
    });
    $("#equal_entries_but").click(function(){
        $("#equal_entries_abs").show();
    });
});