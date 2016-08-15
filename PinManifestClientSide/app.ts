

window.onload = () => {
    
    document.getElementById("fileUpload").onchange = function (e) {
        var filesList: HTMLInputElement = <HTMLInputElement>document.getElementById("fileUpload");
        if ('files' in filesList) {
            if (filesList.files.length == 0) {
                return;
            }
            var file = filesList.files[0];
            if (file.name.split(".")[1] != "xml") {
                return;
            }
            var fileReader = new FileReader();
            fileReader.onloadend = function () {
                var contents = fileReader.result;

                var portReader = new PinManifest(contents);
                var ports = portReader.readPorts();

                var vhdlCreator = new RoboRioVHDL.VHDLMaker(ports);
                var vhdlDisplay = <HTMLTextAreaElement>document.getElementById("genVhdl")
                vhdlDisplay.value = vhdlCreator.makeVHDL();
            }
            fileReader.readAsText(file);
        }
    };

};
