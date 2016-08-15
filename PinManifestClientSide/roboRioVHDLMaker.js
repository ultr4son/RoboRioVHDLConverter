var RoboRioVHDL;
(function (RoboRioVHDL) {
    var VHDLMaker = (function () {
        function VHDLMaker(ports) {
            this.ports = ports;
            this.needEncoder = false;
            this.needPWM = false;
            for (var _i = 0; _i < ports.length; _i++) {
                var port = ports[_i];
                var bus = port.fullName.split("_")[0];
                //Check for special cases
                this.needEncoder = this.needEncoder || bus == "ENCODER";
                this.needPWM = this.needPWM || bus == "PWM";
            }
        }
        VHDLMaker.prototype.makeVHDL = function () {
            var vhdl = "";
            vhdl += RoboRioVHDLTemplate.commentHeader();
            //Encoders and PWM need extra conversion blocks
            if (this.needEncoder) {
                vhdl += RoboRioVHDLTemplate.encoder();
            }
            if (this.needPWM) {
                vhdl += RoboRioVHDLTemplate.qToPWM();
            }
            vhdl += RoboRioVHDLTemplate.roboRioEntity(RoboRioVHDLTemplate.roboRioPorts(this.ports));
            vhdl += RoboRioVHDLTemplate.architectureHeader();
            for (var _i = 0, _a = this.ports; _i < _a.length; _i++) {
                var port = _a[_i];
                var portSplit = port.fullName.split("_");
                //Encoder and PWM need extra wires for blocks
                if (portSplit[0] == "ENCODER") {
                    if (portSplit[1] == "COUNTS") {
                        vhdl += RoboRioVHDLTemplate.wireEncoderCounts(port.fullName);
                    }
                    else if (portSplit[1] == "REVERSE") {
                        vhdl += RoboRioVHDLTemplate.wireEncoderReverse(port.fullName);
                    }
                }
                else if (portSplit[0] == "PWM") {
                    vhdl += RoboRioVHDLTemplate.wireMotorPWM(port.fullName);
                }
            }
            vhdl += RoboRioVHDLTemplate.beginAndSVX();
            for (var _b = 0, _c = this.ports; _b < _c.length; _b++) {
                var port = _c[_b];
                var portSplit = port.fullName.split("_");
                //Check for special encoder and PWM case
                if (portSplit[0] == "ENCODER") {
                    if (portSplit[1] == "COUNTS") {
                        vhdl += RoboRioVHDLTemplate.wireEncoder(port.fullName);
                        continue;
                    }
                    else if (portSplit[1] == "REVERSE") {
                        vhdl += RoboRioVHDLTemplate.wireBooleanConsumer(port.fullName, RoboRioVHDLTemplate.encoderReverseWireName(port.fullName));
                        continue;
                    }
                }
                else if (port.fullName.split("_")[0] == "PWM") {
                    vhdl += RoboRioVHDLTemplate.wirePWM(port.fullName);
                    continue;
                }
                //IO Type is relative to the device, so swap sending and reciving
                if (port.portIOType == "in") {
                    if (port.portValueType == "real") {
                        vhdl += RoboRioVHDLTemplate.wireRealGenerator(port.fullName, port.fullName);
                    }
                    else if (port.portValueType == "boolean") {
                        vhdl += RoboRioVHDLTemplate.wireBooleanGenerator(port.fullName, port.fullName);
                    }
                    else {
                        throw "Invalid port type " + port.portValueType;
                    }
                }
                else if (port.portIOType == "out") {
                    if (port.portValueType == "real") {
                        vhdl += RoboRioVHDLTemplate.wireRealConsumer(port.fullName, port.fullName);
                    }
                    else if (port.portValueType == "boolean") {
                        vhdl += RoboRioVHDLTemplate.wireBooleanConsumer(port.fullName, port.fullName);
                    }
                    else {
                        throw "Invalid port type " + port.portValueType;
                    }
                }
                else {
                    throw "Invalid IO type " + port.portIOType;
                }
            }
            vhdl += RoboRioVHDLTemplate.architectureEnd();
            return vhdl;
        };
        return VHDLMaker;
    })();
    RoboRioVHDL.VHDLMaker = VHDLMaker;
})(RoboRioVHDL || (RoboRioVHDL = {}));
//# sourceMappingURL=roboRioVHDLMaker.js.map