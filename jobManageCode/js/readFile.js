function readXlsxToJson(data, name) {
    var workbook = XLSX.read(data, {
        type: 'binary'
    });
    var formmatName = function (tableHeadName) {
       
        function formmat(key) {
            var name;
            tableHeadName[key] && (name = tableHeadName[key]());
            return name;
        }
        return {
            formmat: formmat
        }
    }(name);

    var sheetNames = workbook.SheetNames;
    sheetNames.forEach(function (name, index, arr) {
        // 只能通过工作表名称来获取指定工作表
        var worksheet = workbook.Sheets[name];
        for (var key in worksheet) {
            if (key[key.length - 1] === '1') {
                worksheet[key].w = formmatName.formmat(worksheet[key].v)
            }
        }
    });

    return XLSX.utils.sheet_to_json(workbook.Sheets[sheetNames[0]]);
}