
$(document).ready(function(){
    $(document).on('shown.bs.tab', 'a[data-toggle="tab"]', function (e) {
        activeTab2 = $('.nav-tabs .active').text();
        console.log('TAB CHANGED to: ' + $('.nav-tabs .active').text());
    });
});


//var activeTab2='';
//var hash = window.location.hash;
/*
$(document).ready(function(){

    console.log('all is well');

    //load essentials tab as active
    //$('#maintab a[href="#inStock"]').tab('show');

    //get activated and previous tabs access
    $('#maintab').on('shown.bs.tab', function (e) {
        console.log(e.target); // newly activated tab
        //console.log(e.relatedTarget); // previous active tab
    })


    //***********************************************************
    // get hash & tab access by url
    /*
    console.log('url hash enabled');

    hash && $('ul.nav a[href="' + hash + '"]').tab('show');

    $('.nav-tabs a').click(function (e) {
        $(this).tab('show');
        var scrollmem = $('body').scrollTop();
        window.location.hash = this.hash;
        $('html,body').scrollTop(scrollmem);

    });
    */
    //***********************************************************

/*

    $(document).on('shown.bs.tab', 'a[data-toggle="tab"]', function (e) {
        activeTab2 = $('.nav-tabs .active').text();
        console.log('TAB CHANGED to: '+ $('.nav-tabs .active').text());
        activeTab2 = $('.nav-tabs .active').text();
        if (activeTab2 == 'SCAN IN'){
            console.log('TAB CHANGED to: '+ $('.nav-tabs .active').text()); // check if user change to SCAN IN tab
            activeTab2 = $('.nav-tabs .active').text();

            //just execute scan in process if the active tab is 'scan in'. It's need it to do the same with scan out
            $(document).scannerDetection();
            $(document).bind('scannerDetectionComplete',function(e,data){
                console.log('complete: '+data.string);
                document.getElementById("bCodeMessage").innerHTML = 'Scanning code: '+data.string; //+ '<div class="loader"></div>' ;
                //document.getElementById("bCodeMessage").innerHTML = '<p> Scanning code <span class="fa fa-spinner fa-spin"></span></p>'+data.string;
                if(data.string){
                    console.log('scanning in');
                    document.getElementById("codeProduct").value = data.string;
                    document.getElementById("codeForm").submit();

                    activeTab2='';
                }
            })



                .bind('scannerDetectionError',function(e,data){
                    console.log('detection error '+data.string);
                    codeKnown = false;
                })
                .bind('scannerDetectionReceive',function(e,data){
                    console.log('Received');
                    console.log(data.evt.which);
                })
            activeTab2 = $('.nav-tabs .active').text();


        }
        if (activeTab2 == 'SCAN OUT'){
            console.log('TAB CHANGED to: '+ $('.nav-tabs .active').text()); // check if user change to SCAN IN tab

            //just execute scan in process if the active tab is 'scan in'. It's need it to do the same with scan out
            $(document).scannerDetection();
            $(document).bind('scannerDetectionComplete',function(e,data){
                console.log('complete: '+data.string);
                document.getElementById("bCodeMessageOut").innerHTML = 'Scanning code: '+data.string;

                if(data.string){
                    console.log('scanning out');
                    document.getElementById("codeProductOut").value = data.string;
                    document.getElementById("scanoutForm").submit();

                    activeTab2='';
                }
            })



                .bind('scannerDetectionError',function(e,data){
                    console.log('detection error '+data.string);
                    codeKnown = false;
                })
                .bind('scannerDetectionReceive',function(e,data){
                    console.log('Received');
                    console.log(data.evt.which);
                })

        }
        //activeTab2='';
        console.log('TAB CHANGED to: '+ $('.nav-tabs .active').text());
        activeTab2 = $('.nav-tabs .active').text();
        console.log(activeTab2);

    })


});

*/