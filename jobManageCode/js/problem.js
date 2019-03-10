function checkedAll(id) {
    $("#problemOfPerson").hide();
    $("#allProblems").show();
    detailTable.load(id, true);
    $("#problemNum").text(problems.info.length);
}
var problems = {
    info: [],
    processState: function (problem) {
        problem.stateId = problem.state[0];
        return this;
    }
}

var processers = {
    info: {},
    getProcesserAndProblem: function (problem) {
        var __info = this.info;
        var person = problem.processer;
        if (!__info[person]) {
            __info[person] = {
                all: [],
                state: {
                    processing: [],
                    finished: [],
                    other: []
                },
                grade: {
                    little: [],
                    normal: [],
                    bad: [],
                    terrible: []
                }
            };
        }
        __info[problem.processer].all.push(problem);

        //按处理阶段统计 
        var stateId = problem.stateId;
        if (('3' == stateId) || ('5' == stateId) || ('B' == stateId)) {
            __info[person].state.processing.push(problem);
        } else if (('0' == stateId) || ('E' == stateId) || ('F' == stateId) || ('G' == stateId)) {
            __info[person].state.finished.push(problem);
        } else {
            __info[person].state.other.push(problem);
        }

        //按问题级别统计
        switch (problem.stateId) {
            case '提示':
                {
                    __info[person].grade.little.push(problem);
                    break;
                };
            case '一般':
                {
                    __info[person].grade.normal.push(problem);
                    break;
                };
            case '严重':
                {
                    __info[person].grade.bad.push(problem);
                    break;
                };
            case '致命':
                {
                    __info[person].grade.terrible.push(problem);
                    break;
                };
            default:
                {
                    break;
                }
        }
        return this;
    }
}

var personNav = {
    data: {},
    navHtml: '<div class="meunItem" id="menuAll" onclick="checkedAll(this.id)">全部</div>',
    formateString: function (str, person) {
        return str.replace(/\{#(\w+)#\}/g, person);

    },
    createItem: function (data) {
        // 导航样式模板
        var item = '<div class="meunItem" id="{#name#}" class="personsNav" onclick="personNav.go(this.id)">{#name#}</div>';
        this.navHtml += this.formateString(item, data);
        return this;
    },
    createNav: function () {
        var __info = processers.info;
        for (person in __info) {
            this.createItem(person);
        }

        $('#personMeun').append(this.navHtml);
    },
    go: function (id) {
        $("#allProblems").hide();
        $("#problemOfPerson").show();

        $("#problemNum").text(processers.info[id].all.length);

        echartsClass.state.init('stateEcharts').setOption(id);
        echartsClass.grade.init('gradeEcharts').setOption(id);
        detailTable.load(id, false);
    }
};

var echartsClass = {
    color:['#fcb536', '#4ddfa1', '#00c77d','fcd473'],
    all: {
        id: echarts.init(document.getElementById('proceserEchart')),
        option: {
            grid: {
                left: '60px',
                right: '50px',
                top: '50px',
                bottom: '30px'
            },
            color: ["#ffe300cc","#00bcd4","#339ca8","#c12e34"],
            xAxis: {
                type: 'category',
                data: [],
            },
            yAxis: {
                type: 'value',
                name:'问题总数'
            },
            series: [{
                name: '问题总数',
                type: 'bar',
                data: [],
            }]
        },
        getData: function () {
            var info = processers.info;
            var data = {
                person: [],
                problem: [],
            }
            for (person in info) {
                var problem = info[person]
                data.person.push(person);
                data.problem.push(problem.all.length);
            }
            return data;
        },
        setOption: function () {
            var data = this.getData();
            this.option.xAxis.data = data.person;
            this.option.series[0].data = data.problem;
            this.id.setOption(this.option);
            return this;
        }
    },
    state: {
        id: 0,
        init: function (domId) {
            return function (domId) {
                this.id = echarts.init(document.getElementById(domId));
                return this;
            }
        }(),
        option: {
            color: [ "#e6b600","#0098d9","#339ca8","#cda819","#32a487"],
            series: [{
                name: '修改阶段',
                type: 'pie',
                radius: ['55%', '75%'],
                center: ['50%', '50%'],
                label:{
                    show:true,
                    color:'#343E50',
                },
                lableLine:{
                    lineStyle:{
                        color:'#343E50',
                    }
                },
                data: [],
                itemStyle: {
                    emphasis: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                    }
                }
            }]
        },
        getData: function (person) {
            var info = processers.info[person].state;
            return [{
                    name: '定位修改',
                    value: info.processing.length
                },
                {
                    name: '完成',
                    value: info.finished.length
                },
                {
                    name: '其他',
                    value: info.other.length
                },
            ]
        },
        setOption: function (person) {
            this.option.series[0].data = this.getData(person);
            this.id.setOption(this.option);
            return this;
        }
    },
    grade: {
        id: 0,
        init: function (domId) {
            return function (domId) {
                this.id = echarts.init(document.getElementById(domId));
                return this;
            }
        }(),
        option: {
            color: [ "#e6b600","#0098d9","#339ca8","#c12e34"],
            series: [{
                name: '问题级别',
                type: 'pie',
                radius: ['55%', '75%'],
                center: ['50%', '50%'],
                data: [],
                itemStyle: {
                    emphasis: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                    }
                }
            }]
        },
        getData: function (person) {
            var info = processers.info[person].grade;
            return [{
                    name: '提示',
                    value: info.little.length
                },
                {
                    name: '一般',
                    value: info.normal.length
                },
                {
                    name: '严重',
                    value: info.bad.length
                },
                {
                    name: '致命',
                    value: info.terrible.length
                },
            ]
        },
        setOption: function (person) {
            this.option.series[0].data = this.getData(person);
            this.id.setOption(this.option);
            return this;
        }
    },

    resizeAll: function () {
        this.all.id && this.all.id.resize();
        this.state.id && this.state.id.resize();
        this.grade.id && this.grade.id.resize();
    },
}

var detailTable = {
    init: function () {
        $('#detailTable').bootstrapTable({
            pagination: true,
            columns: [{
                    field: 'id',
                    title: '问题单号'
                },
                {
                    field: 'describe',
                    title: '简述'
                },
                {
                    field: 'processer',
                    title: '当前处理人'
                },
                {
                    field: 'state',
                    title: '当前状态'
                },
                {
                    field: 'grade',
                    title: '严重程度'
                },
            ],
            data: problems.info,
        });
        return this;
    },
    load: function(person, isAll){
        if(isAll){
            $('#detailTable').bootstrapTable('load', problems.info);
        }else{
            $('#detailTable').bootstrapTable('load', processers.info[person].all);
        }
        return true;
    }
}


var fileColumName = {
    "问题单号": function () {
        return 'id';
    },
    "简述": function () {
        return 'describe';
    },
    "当前责任人": function () {
        return 'processer';
    },
    "当前状态": function () {
        return 'state';
    },
    "严重程度": function () {
        return 'grade';
    },
    "提单人": function () {
        return 'problemer';
    }
}

function processData() {
    problems.info.forEach(problem => {
        problems.processState(problem);
        processers.getProcesserAndProblem(problem);
    });
}

$('#problem-file').change(function (e) {
    var files = e.target.files;
    var fileReader = new FileReader();
    fileReader.readAsBinaryString(files[0]);

    fileReader.onload = function (e) {

        // 读取 excel文件
        problems.info = readXlsxToJson(e.target.result, fileColumName);

        // 预处理数据
        processData();
        personNav.createNav();

        // 生成全部问题统计柱状图 全部问题表格数据
        $("#problemNum").text(problems.info.length);
        echartsClass.all.setOption();
        detailTable.init();

        console.log(problems);
        console.log(processers);
        console.log(personNav);
    }
})

$(window).resize(function(){
    echartsClass.resizeAll();
});