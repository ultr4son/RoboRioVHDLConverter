var RoboRioVHDL;
(function (RoboRioVHDL) {
    var VHDLMaker = (function () {
        function VHDLMaker(ports) {
            //Sort out the ports for easier processing later
            this.normalPorts = [];
            this.encoderCountsPorts = [];
            this.pwmOutputPorts = [];
            for (var _i = 0; _i < ports.length; _i++) {
                var port = ports[_i];
                var bus = port.name.split("_")[0];
                var socket = port.name.split("_")[1];
                if (bus == "ENCODER" && socket == "COUNTS") {
                    this.encoderCountsPorts.push(port);
                }
                else if (bus == "PWM" && socket == "OUTPUT") {
                    this.pwmOutputPorts.push(port);
                }
                else {
                    this.normalPorts.push(port);
                }
            }
        }
        VHDLMaker.prototype.addEncoder = function (port, roboRioEntity, roboRioArchitecture) {
            //Create the two external ports
            var splitPorts = this.splitEncoderPort(port);
            roboRioEntity.ports.push(splitPorts.aPort);
            roboRioEntity.ports.push(splitPorts.bPort);
            //Create the signal to carry the counts from the encoder to the svx connection
            var countsSignal = new VHDLFormatting.VHDLSignal(port.name + "_COUNTS_SIGNAL", "real", "quantity");
            roboRioArchitecture.signals.push(countsSignal);
            //Connect the counts signal to the SVX port 
            roboRioArchitecture.connections.push(new VHDLFormatting.SVXConnection(port, countsSignal));
            //Create the internal port and signal that accesses reverse
            var reverseEncoderSignal = new VHDLFormatting.VHDLSignal(port.name + "_REVERSE", "boolean", "signal");
            var reverseEncoderPort = new SVXPort("ENCODER_REVERSE_" + splitPorts.aPortNumber + "_" + splitPorts.bPortNumber, "out", "boolean");
            roboRioArchitecture.signals.push(reverseEncoderSignal);
            //Add the connection to get the reverse encoder signal
            roboRioArchitecture.connections.push(new VHDLFormatting.SVXConnection(reverseEncoderPort, reverseEncoderSignal));
            //Add the connection to calculate encoder counts
            var encoderCountsPorts = [
                new VHDLFormatting.Map("d_in_1", splitPorts.aPort.name),
                new VHDLFormatting.Map("d_in_2", splitPorts.bPort.name),
                new VHDLFormatting.Map("encoder_count", countsSignal.name),
                new VHDLFormatting.Map("reverse_counts", reverseEncoderSignal.name)
            ];
            roboRioArchitecture.connections.push(new VHDLFormatting.VHDLConnection(port.name + "_COUNTS", RoboRioVHDLResource.encoderName(), [], encoderCountsPorts));
        };
        VHDLMaker.prototype.addPWM = function (port, roboRioEntity, roboRioArchitecture) {
            var outputPort = new VHDLFormatting.VHDLPort(port.name, port.IOType, "std_logic", "signal");
            roboRioEntity.ports.push(outputPort);
            //Create the signal to carry the unconverted values
            var toPWMSignal = new VHDLFormatting.VHDLSignal(port.name + "_DUTY", "real", "quantity");
            roboRioArchitecture.signals.push(toPWMSignal);
            //Create the connection to output the converted signals
            roboRioArchitecture.connections.push(new VHDLFormatting.VHDLConnection(port.name + "_TO_PWM", RoboRioVHDLResource.qToPWMName(), [], [
                {
                    propertyName: "input",
                    propertyValue: toPWMSignal.name
                },
                {
                    propertyName: "pwm_out",
                    propertyValue: port.name
                }
            ]));
            //Create the connection to get the unconverted values
            roboRioArchitecture.connections.push(new VHDLFormatting.SVXConnection(port, toPWMSignal));
        };
        VHDLMaker.prototype.splitEncoderPort = function (port) {
            var splitPorts = {
                aPort: null,
                bPort: null,
                aPortNumber: null,
                bPortNumber: null
            };
            //Externally, an encoder appears as two ports.
            var portNameSplit = port.name.split("_");
            splitPorts.bPortNumber = Number(portNameSplit.pop()); // Remove the number of the b port
            var aPortName = portNameSplit.join("_"); //Name now only has the a port number
            splitPorts.aPortNumber = Number(portNameSplit.pop()); //Don't need the a port number now.
            portNameSplit.push(splitPorts.bPortNumber.toString());
            var bPortName = portNameSplit.join("_");
            splitPorts.aPort = new VHDLFormatting.VHDLPort(aPortName, "in", "std_logic", "signal");
            splitPorts.bPort = new VHDLFormatting.VHDLPort(bPortName, "in", "std_logic", "signal");
            return splitPorts;
        };
        VHDLMaker.prototype.makeVHDL = function () {
            var entityLibraries = [{
                    libraryName: "IEEE",
                    usings: ["std_logic_1164"]
                }];
            var archLibraries = [{
                    libraryName: "SVX",
                    usings: ["SVX_Resources"]
                }];
            var roboRioEntity = new VHDLFormatting.VHDLCompositeEntity("RoboRio", new VHDLFormatting.VHDLLibraryUsing(entityLibraries));
            var roboRioArchitecture = new VHDLFormatting.VHDLCompositeArchitecture("RoboRio", new VHDLFormatting.VHDLLibraryUsing(archLibraries));
            var entities = [];
            var architectures = [];
            entities.push(roboRioEntity);
            architectures.push(roboRioArchitecture);
            for (var _i = 0, _a = this.normalPorts; _i < _a.length; _i++) {
                var port = _a[_i];
                roboRioEntity.ports.push(new VHDLFormatting.VHDLPort(port.name, port.IOType, port.valueType, port.valueType == "real" ? "quantity" : "signal"));
                roboRioArchitecture.connections.push(new VHDLFormatting.SVXConnection(port, port)); //Port in symbol and entity are named the same
            }
            if (this.encoderCountsPorts.length > 0) {
                entities.push(new VHDLFormatting.VHDLChunk(RoboRioVHDLResource.encoderEntityFull()));
                architectures.push(new VHDLFormatting.VHDLChunk(RoboRioVHDLResource.encoderArchitectureFull()));
                for (var _b = 0, _c = this.encoderCountsPorts; _b < _c.length; _b++) {
                    var port = _c[_b];
                    this.addEncoder(port, roboRioEntity, roboRioArchitecture);
                }
            }
            if (this.pwmOutputPorts.length > 0) {
                entities.push(new VHDLFormatting.VHDLChunk(RoboRioVHDLResource.qToPWMEntity()));
                architectures.push(new VHDLFormatting.VHDLChunk(RoboRioVHDLResource.qToPWMArch()));
                for (var _d = 0, _e = this.pwmOutputPorts; _d < _e.length; _d++) {
                    var port = _e[_d];
                    this.addPWM(port, roboRioEntity, roboRioArchitecture);
                }
            }
            var roboRioCommentHeader = new VHDLFormatting.VHDLCommentHeader("RoboRio", "Author", "I am a generated RoboRio!");
            var roboRio = new VHDLFormatting.VHDLFile(entities, architectures, roboRioCommentHeader);
            return roboRio.toVhdl();
        };
        return VHDLMaker;
    })();
    RoboRioVHDL.VHDLMaker = VHDLMaker;
})(RoboRioVHDL || (RoboRioVHDL = {}));
//# sourceMappingURL=roboRioVHDLMaker.js.map