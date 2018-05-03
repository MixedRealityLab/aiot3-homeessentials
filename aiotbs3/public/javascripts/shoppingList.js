var editor;

$(document).ready(function() {
    var getUserId = $("#HideUserId").val();
    //console.log('userId:'+$("#HideUserId").val());
    console.log('userId:'+getUserId);


    //modal css work
    $('.modal-child').on('show.bs.modal', function () {
        var modalParent = $(this).attr('data-modal-parent');
        $(modalParent).css('opacity', 0);
    });

    $('.modal-child').on('hidden.bs.modal', function () {
        var modalParent = $(this).attr('data-modal-parent');
        $(modalParent).css('opacity', 1);
    });


    $('#myList').on('shown.bs.modal', function () {
    $.fn.dataTable.tables({visible: true, api: true}).columns.adjust();

    //IN STOCK ESSENTIALS DATATABLE
    var ListTable = $('#shoppinglist_data').DataTable({
        "bFilter": false,
        "bInfo": false,
        "ordering": false,
        "ajax": {
            url: '/getInitialShoppingList',
            type: 'POST',
            data: {userId: getUserId}

        },
        "columns": [
            {data: "description"},
            //{data: "stock_level"},//{data: "level"},
            {data: "stock"},


        ],
        "lengthChange": false,
        "length": 10,
        "paging": false,
        "destroy": true,
        "scrollY": '300px'

    });
    });



    //IN STOCK ESSENTIALS DATATABLE

    $('#noAutonomous').on('shown.bs.modal', function () {

        $.fn.dataTable.tables({visible: true, api: true}).columns.adjust();
        var ListTableNoAutonomous = $('#shoppinglist_dataNA').DataTable({
            "bFilter": false,
            "bInfo": false,
            "ordering": false,
            "ajax": {
                url: '/getInitialShoppingList',
                type: 'POST',
                data: {userId: getUserId}

            },
            "columns": [
                {data: "description"},
                //{data: "stock_level", className: 'editable'},//{data: "level"},
                {data: "stock"},
                //{
                //    data: null,
                //    defaultContent: "<button type='buttonEspecial' class='btn btn-success btn-sm'> <i class='glyphicon glyphicon-plus'></i> </button>"
                //},
                {
                    data: null,
                    defaultContent: "<button type='buttonEspecial' class='btn btn-danger btn-sm'> <i class='glyphicon glyphicon-trash'></i> </button>"
                }

            ],
            //"order": [[1, 'asc']],
            "lengthChange": false,
            "length": 10,
            "paging": false,
            "destroy": true,
            "scrollY": '300px',

        });
    });

    $('#semiAutonomous').on('shown.bs.modal', function () {

        $.fn.dataTable.tables({visible: true, api: true}).columns.adjust();
        var ListTableSemiAutonomous = $('#shoppinglist_semiautonomous').DataTable({
            "bFilter": false,
            "bInfo": false,
            "ordering": false,
            "ajax": {
                url: '/getInitialShoppingList',
                type: 'POST',
                data: {userId: getUserId}

            },
            "columns": [
                {data: "description"},
                //{data: "stock_level", className: 'editable'},//{data: "level"},
                {data: "stock"},


            ],
            //"order": [[1, 'asc']],
            "lengthChange": false,
            "length": 10,
            "paging": false,
            "destroy": true,
            "scrollY": '300px',

        });
    });



    $('#Autonomous').on('shown.bs.modal', function () {

        $.fn.dataTable.tables({visible: true, api: true}).columns.adjust();
        var ListTableAutonomous = $('#shoppinglist_autonomous').DataTable({
            "bFilter": false,
            "bInfo": false,
            "ordering": false,
            "ajax": {
                url: '/getInitialShoppingList',
                type: 'POST',
                data: {userId: getUserId}

            },
            "columns": [
                {data: "description"},
                //{data: "stock_level", className: 'editable'},//{data: "level"},
                {data: "stock"},


            ],
            //"order": [[1, 'asc']],
            "lengthChange": false,
            "length": 10,
            "paging": false,
            "destroy": true,
            "scrollY": '300px',

        });
    });


});