var SVXPort = (function () {
    function SVXPort(fullName, portIOType, portValueType) {
        this.name = fullName;
        this.IOType = portIOType;
        this.valueType = portValueType;
    }
    return SVXPort;
})();
var PinManifest = (function () {
    function PinManifest(xmlContents) {
        this.manifest = $.parseXML(xmlContents);
    }
    PinManifest.prototype.readDeviceType = function () {
        return this.manifest.childNodes[0].nodeName;
    };
    PinManifest.prototype.readPorts = function () {
        var base = this.manifest.childNodes[0];
        var buses = base.childNodes;
        var svxPorts = [];
        //Ports are formatted 
        //Bus 
        //  ---> Port  
        for (var i = 0; i < buses.length; i++) {
            var bus = buses[i];
            var busName = bus.nodeName.toUpperCase();
            if (busName == "#TEXT") {
                continue;
            }
            var busAttributes = bus.attributes;
            var ports = bus.childNodes;
            for (var x = 0; x < ports.length; x++) {
                var port = ports[x];
                var portName = port.nodeName.toUpperCase();
                if (portName == "#TEXT") {
                    continue;
                }
                var portAttributes = port.attributes;
                var busNumbers = this.unpackNumericValues(busAttributes);
                var portNumbers = this.unpackNumericValues(portAttributes);
                var completePort = new SVXPort(this.formatName(busName, portName, busNumbers.concat(portNumbers)), portAttributes.getNamedItem("IOType").value, portAttributes.getNamedItem("ValueType").value);
                svxPorts.push(completePort);
            }
        }
        return svxPorts;
    };
    PinManifest.prototype.formatName = function (busName, portName, numerics) {
        var name = busName + "_" + portName;
        for (var i = 0; i < numerics.length; i++) {
            name += "_";
            name += numerics[i];
        }
        return name;
    };
    PinManifest.prototype.unpackNumericValues = function (attributes) {
        for (var i = 0; i < attributes.length; i++) {
            var attribute = attributes.item(i);
            if (attribute.name == "ChannelArgs") {
                var args = attribute.value.split(",");
                var numerics = [];
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
    };
    PinManifest.prototype.unpackNumericNames = function (attributes) {
        var names = [];
        for (var i = 0; i < attributes.length; i++) {
            var attribute = attributes.item(i);
            if (!isNaN(parseInt(attribute.value, 10))) {
                names.push(attribute.nodeName);
            }
        }
        return names;
    };
    return PinManifest;
})();
//# sourceMappingURL=PinManifest.js.map