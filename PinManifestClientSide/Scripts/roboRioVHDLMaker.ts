
module RoboRioVHDL {
    export class VHDLMaker {
        normalPorts: SVXPort[];
        //Encoder and PWM ports need extra processing done.
        encoderCountsPorts: SVXPort[];
        pwmOutputPorts: SVXPort[];
        private addEncoder(port: SVXPort, roboRioEntity: VHDLFormatting.VHDLCompositeEntity, roboRioArchitecture: VHDLFormatting.VHDLCompositeArchitecture) {
          
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

            ]
            roboRioArchitecture.connections.push(new VHDLFormatting.VHDLConnection(port.name + "_COUNTS", RoboRioVHDLResource.encoderName(), [], encoderCountsPorts));

        }
        private addPWM(port: SVXPort, roboRioEntity: VHDLFormatting.VHDLCompositeEntity, roboRioArchitecture: VHDLFormatting.VHDLCompositeArchitecture) {
            var outputPort = new VHDLFormatting.VHDLPort(port.name, port.IOType, "std_logic", "signal")
            roboRioEntity.ports.push(outputPort);

            //Create the signal to carry the unconverted values
            var toPWMSignal = new VHDLFormatting.VHDLSignal(port.name + "_DUTY", "real", "quantity");
            roboRioArchitecture.signals.push(toPWMSignal);

            //Create the connection to output the converted signals
            roboRioArchitecture.connections.push(
                new VHDLFormatting.VHDLConnection(port.name + "_TO_PWM",
                    RoboRioVHDLResource.qToPWMName(),
                    [],
                    [
                        {
                            propertyName: "input",
                            propertyValue: toPWMSignal.name
                        },
                        {
                            propertyName: "pwm_out",
                            propertyValue: port.name
                        }
                    ]
                    )
                );

            //Create the connection to get the unconverted values
            roboRioArchitecture.connections.push(new VHDLFormatting.SVXConnection(port, toPWMSignal));
            
        }
        private splitEncoderPort(port: SVXPort): {
            aPort: VHDLFormatting.VHDLPort,
            bPort: VHDLFormatting.VHDLPort,
            aPortNumber: number,
            bPortNumber: number
        } {
            var splitPorts: {
                aPort: VHDLFormatting.VHDLPort,
                bPort: VHDLFormatting.VHDLPort,
                aPortNumber: number,
                bPortNumber: number
            } = {
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

        }
        
        constructor(ports: SVXPort[]) {
            //Sort out the ports for easier processing later
            this.normalPorts = [];
            this.encoderCountsPorts = [];
            this.pwmOutputPorts = [];
            for (var port of ports) {
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
        public makeVHDL(): string {
            var entityLibraries = [{
                libraryName: "IEEE",
                usings: ["std_logic_1164"]
            }];
            var archLibraries = [{
                    libraryName: "SVX",
                    usings: ["SVX_Resources"]
            }];
            var roboRioEntity: VHDLFormatting.VHDLCompositeEntity = new VHDLFormatting.VHDLCompositeEntity("RoboRio", new VHDLFormatting.VHDLLibraryUsing(entityLibraries));
            var roboRioArchitecture: VHDLFormatting.VHDLCompositeArchitecture = new VHDLFormatting.VHDLCompositeArchitecture("RoboRio", new VHDLFormatting.VHDLLibraryUsing(archLibraries));

            var entities: (VHDLFormatting.VHDLEntity | VHDLFormatting.VHDLChunk)[] = [];
            var architectures: (VHDLFormatting.VHDLArchitecture| VHDLFormatting.VHDLChunk)[] = [];

            entities.push(roboRioEntity);
            architectures.push(roboRioArchitecture);
            
            for (var port of this.normalPorts) {
                roboRioEntity.ports.push(new VHDLFormatting.VHDLPort(port.name, port.IOType, port.valueType, port.valueType == "real" ? "quantity" : "signal"));
                roboRioArchitecture.connections.push(new VHDLFormatting.SVXConnection(port, port)); //Port in symbol and entity are named the same
            }
            if (this.encoderCountsPorts.length > 0) {

                entities.push(new VHDLFormatting.VHDLChunk(RoboRioVHDLResource.encoderEntityFull()));
                architectures.push(new VHDLFormatting.VHDLChunk(RoboRioVHDLResource.encoderArchitectureFull()));

                for (var port of this.encoderCountsPorts) {
                    this.addEncoder(port, roboRioEntity, roboRioArchitecture);
                }
            }
            if (this.pwmOutputPorts.length > 0) {
                entities.push(new VHDLFormatting.VHDLChunk(RoboRioVHDLResource.qToPWMEntity()));
                architectures.push(new VHDLFormatting.VHDLChunk(RoboRioVHDLResource.qToPWMArch()));

                for (var port of this.pwmOutputPorts) {
                    this.addPWM(port, roboRioEntity, roboRioArchitecture);
                }
            }

            var roboRioCommentHeader: VHDLFormatting.VHDLCommentHeader = new VHDLFormatting.VHDLCommentHeader("RoboRio", "Author", "I am a generated RoboRio!");
            var roboRio = new VHDLFormatting.VHDLFile(entities, architectures, roboRioCommentHeader);

            return roboRio.toVhdl();
 
        }
        //public makeVHDL(): string {
        //    var vhdl: string = "";
        //    vhdl += RoboRioVHDLTemplate.commentHeader();
        //    //Encoders and PWM need extra conversion blocks
            
        //    vhdl += RoboRioVHDLTemplate.roboRioEntity(RoboRioVHDLTemplate.roboRioPorts(this.ports));
        //    if (this.needEncoder) {
        //        vhdl += RoboRioVHDLTemplate.encoder();
        //    }
        //    if (this.needPWM) {
        //        vhdl += RoboRioVHDLTemplate.qToPWM();
        //    }
        //    vhdl += RoboRioVHDLTemplate.architectureHeader();
        //    for (var port of this.ports) {
        //        var portSplit = port.name.split("_");
        //        //Encoder and PWM need extra wires for blocks
        //        if (portSplit[0] == "ENCODER") {
        //            if (portSplit[1] == "COUNTS") {
        //                vhdl += RoboRioVHDLTemplate.signalEncoderCounts(port.name);
        //                vhdl += RoboRioVHDLTemplate.signalEncoderReverse(port.name);
        //            }
        //        }
        //        else if (portSplit[0] == "PWM") {
        //            vhdl += RoboRioVHDLTemplate.signalPWM(port.name);
        //        }
        //    }
        //    vhdl += RoboRioVHDLTemplate.beginAndSVX();
            
        //    for (var port of this.ports) {
        //        var portSplit = port.name.split("_");
        //        //Check for special encoder and PWM case
        //        if (portSplit[0] == "ENCODER") {
        //            if (portSplit[1] == "COUNTS") {
        //                vhdl += RoboRioVHDLTemplate.wireEncoder(port.name);
        //                continue;
        //            }
        //        }
        //        else if (port.name.split("_")[0] == "PWM") {
        //            vhdl += RoboRioVHDLTemplate.wirePWM(port.name);
        //            continue;
        //        }
        //        //IO Type is relative to the device, so swap sending and reciving
        //        if (port.portIOType == "in") {
        //            if (port.portValueType == "real") {
        //                vhdl += RoboRioVHDLTemplate.wireRealGenerator(port.name, port.name);
        //            }
        //            else if (port.portValueType == "boolean") {
        //                vhdl += RoboRioVHDLTemplate.wireBooleanGenerator(port.name, port.name);
        //            }
        //            else {
        //                throw "Invalid port type " + port.portValueType;
        //            }
        //        }
        //        else if (port.portIOType == "out") { 
        //            if (port.portValueType == "real") {
        //                vhdl += RoboRioVHDLTemplate.wireRealConsumer(port.name, port.name);
        //            }
        //            else if (port.portValueType == "boolean") {
        //                vhdl += RoboRioVHDLTemplate.wireBooleanConsumer(port.name, port.name);
        //            }
        //            else {
        //                throw "Invalid port type " + port.portValueType;
        //            }
        //        }
        //        else {
        //            throw "Invalid IO type " + port.portIOType;
        //        }
        //    }
        //    vhdl += RoboRioVHDLTemplate.architectureEnd();
           
        //    return vhdl;
        //}

    }
}
