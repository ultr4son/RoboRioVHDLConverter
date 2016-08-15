class SVXPort {
    public name: string; //The SVX port name
    public IOType: string; //out or in
    public valueType: string; //Real, boolean, etc.
    constructor(fullName: string, portIOType: string, portValueType: string) {
        this.name = fullName;
        this.IOType = portIOType;
        this.valueType = portValueType;
    }
}
class PinManifest {
    manifest: XMLDocument;
    constructor(xmlContents: string) {
        this.manifest = $.parseXML(xmlContents);

    }
    public readDeviceType(): string {
        return this.manifest.childNodes[0].nodeName;
    }
    public readPorts(): SVXPort[] {
        var base = this.manifest.childNodes[0];
        var buses = base.childNodes;
        var svxPorts: SVXPort[] = []
  
        //Ports are formatted 
        //Bus 
        //  ---> Port  

        for (var i = 0; i < buses.length; i++) {
            var bus = buses[i];
            var busName = bus.nodeName.toUpperCase();
            if (busName == "#TEXT") { //Skip annoying #TEXT blocks
                continue;
            }
            var busAttributes = bus.attributes;
            var ports = bus.childNodes;
            for (var x = 0; x < ports.length; x++) {
                var port = ports[x];
                var portName = port.nodeName.toUpperCase();
                if (portName == "#TEXT") { //Skip annoying #TEXT blocks
                    continue;
                }
                var portAttributes = port.attributes;
                var busNumbers: number[] = this.unpackNumericValues(busAttributes);
                var portNumbers: number[] = this.unpackNumericValues(portAttributes);

                var completePort = new SVXPort(this.formatName(busName, portName, busNumbers.concat(portNumbers)), portAttributes.getNamedItem("IOType").value, portAttributes.getNamedItem("ValueType").value);
                svxPorts.push(completePort);
            }

        }
        return svxPorts;
    }
    private formatName(busName: string, portName: string, numerics: number[]): string {
        var name = busName + "_" + portName;
        for (var i = 0; i < numerics.length; i++) {
            name += "_"
            name += numerics[i];
        }
        return name;
    }
    private unpackNumericValues(attributes: NamedNodeMap): number[] {
        for (var i = 0; i < attributes.length; i++) {
            var attribute = attributes.item(i);
            if (attribute.name == "ChannelArgs") {
                var args = attribute.value.split(",");
                var numerics = []
                //Now that we've found our arguments, filter out the ones that are integers
                for (var x = 0; x < args.length; x++) {
                    if (!isNaN(parseInt(args[x], 10))) {
                        numerics.push(parseInt(args[x], 10));
                    }
                }
                return numerics;
            }
        }
        return [];
    }
    private unpackNumericNames(attributes: NamedNodeMap) {
        var names = []
        for (var i = 0; i < attributes.length; i++) {
            var attribute = attributes.item(i);
            if (!isNaN(parseInt(attribute.value, 10))) {
                names.push(attribute.nodeName);
            }
        }
        return names;
    }
}
