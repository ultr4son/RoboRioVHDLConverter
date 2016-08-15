var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var VHDLFormatting;
(function (VHDLFormatting) {
    function formatMap(mapping) {
        var formatting = [];
        for (var _i = 0; _i < mapping.length; _i++) {
            var map = mapping[_i];
            formatting.push(map.propertyName + "=>" + map.propertyValue);
        }
        return formatting.join(",");
    }
    function formatVHDLPort(ports) {
        var formatting = [];
        for (var _i = 0; _i < ports.length; _i++) {
            var port = ports[_i];
            formatting.push(port.quantityOrSignal + " " + port.name + ":" + port.IOType + " " + port.valueType);
        }
        return formatting.join(";\n");
    }
    var VHDLFile = (function () {
        function VHDLFile(entities, architectures, header) {
            this.header = header || new VHDLChunk("");
            this.entities = entities;
            this.architectures = architectures;
        }
        VHDLFile.prototype.toVhdl = function () {
            var vhdl = this.header.toVhdl();
            for (var _i = 0, _a = this.entities; _i < _a.length; _i++) {
                var entity = _a[_i];
                vhdl += entity.toVhdl() + "\n";
            }
            for (var _b = 0, _c = this.architectures; _b < _c.length; _b++) {
                var architecture = _c[_b];
                vhdl += architecture.toVhdl() + "\n";
            }
            return vhdl;
        };
        return VHDLFile;
    })();
    VHDLFormatting.VHDLFile = VHDLFile;
    var VHDLCommentHeader = (function () {
        function VHDLCommentHeader(modelTitle, author, description, entityName, created) {
            this.modelTitle = modelTitle;
            this.entityName = entityName || modelTitle;
            this.author = author;
            this.created = created || this.getCreated();
            this.description = description;
        }
        VHDLCommentHeader.prototype.getCreated = function () {
            var date = new Date();
            var hours = date.getHours();
            var hours12 = hours > 12 ? hours - 12 : hours; //date.getHours() gives 24 hour time
            //Make sure there are leading zeros where appropriate
            return ('0' + (date.getMonth() + 1)).slice(-2) + "/" + ('0' + date.getDate()).slice(-2) + "/" + date.getFullYear() + " " + ('0' + hours12).slice(-2) + ":" + ('0' + date.getMinutes()).slice(-2);
        };
        VHDLCommentHeader.prototype.comment = function (content) {
            return "--" + content + "\n";
        };
        VHDLCommentHeader.prototype.commentSeparator = function () {
            return "-------------------------------------------------------------------------------\n";
        };
        VHDLCommentHeader.prototype.toVhdl = function () {
            var vhdl = this.commentSeparator();
            vhdl += this.comment("Model Title: " + this.modelTitle);
            vhdl += this.comment("Entity Name: " + this.entityName);
            vhdl += this.comment("Author: " + this.author);
            vhdl += this.comment("Created: " + this.created);
            vhdl += this.comment("Last update: ");
            vhdl += this.commentSeparator();
            vhdl += this.comment("Description: " + this.description);
            vhdl += this.comment("");
            vhdl += this.comment("Additional description info can be placed here. It will also be available in the tooltip");
            vhdl += this.commentSeparator();
            return vhdl;
        };
        return VHDLCommentHeader;
    })();
    VHDLFormatting.VHDLCommentHeader = VHDLCommentHeader;
    var VHDLEntity = (function () {
        function VHDLEntity(entityName, entityBody, header) {
            this.entityName = entityName;
            this.entityBody = entityBody || "";
            this.header = header || new VHDLChunk("");
        }
        VHDLEntity.prototype.toVhdl = function () {
            var vhdl = this.header.toVhdl();
            vhdl += "entity " + this.entityName + " is\n";
            vhdl += this.entityBody;
            vhdl += "end entity " + this.entityName + ";";
            return vhdl;
        };
        return VHDLEntity;
    })();
    VHDLFormatting.VHDLEntity = VHDLEntity;
    var VHDLCompositeEntity = (function (_super) {
        __extends(VHDLCompositeEntity, _super);
        function VHDLCompositeEntity(entityName, header) {
            _super.call(this, entityName, "", header);
            this.generic = [];
            this.ports = [];
        }
        VHDLCompositeEntity.prototype.toVhdl = function () {
            //VHDL doesn't like empty things
            this.entityBody += this.generic.length > 0 ? "\tgeneric(" + formatVHDLPort(this.generic) + ");\n" : "";
            this.entityBody += this.ports.length > 0 ? "\tport(" + formatVHDLPort(this.ports) + ");\n" : "";
            return _super.prototype.toVhdl.call(this);
        };
        return VHDLCompositeEntity;
    })(VHDLEntity);
    VHDLFormatting.VHDLCompositeEntity = VHDLCompositeEntity;
    var VHDLArchitecture = (function () {
        function VHDLArchitecture(entityName, archBody, header) {
            this.header = header || new VHDLChunk("");
            this.entityName = entityName;
            this.archBody = archBody || "";
        }
        VHDLArchitecture.prototype.toVhdl = function () {
            var vhdl = this.header.toVhdl();
            vhdl += "architecture default of " + this.entityName + " is\n";
            vhdl += this.archBody;
            vhdl += "end architecture default;";
            return vhdl;
        };
        return VHDLArchitecture;
    })();
    VHDLFormatting.VHDLArchitecture = VHDLArchitecture;
    var VHDLCompositeArchitecture = (function (_super) {
        __extends(VHDLCompositeArchitecture, _super);
        function VHDLCompositeArchitecture(entityName, header) {
            _super.call(this, entityName, "", header);
            this.signals = [];
            this.connections = [];
        }
        VHDLCompositeArchitecture.prototype.toVhdl = function () {
            for (var _i = 0, _a = this.signals; _i < _a.length; _i++) {
                var port = _a[_i];
                this.archBody += port.quantityOrSignal + " " + port.name + ": " + port.valueType + ";\n";
            }
            this.archBody += "\tbegin\n";
            for (var _b = 0, _c = this.connections; _b < _c.length; _b++) {
                var connection = _c[_b];
                this.archBody += "\t\t" + connection.connectionName + ": entity " + connection.connectingEntity + "\n";
                if (connection.genericMap.length > 0) {
                    this.archBody += "\t\t\tgeneric map(";
                    this.archBody += formatMap(connection.genericMap);
                    if (connection.portMap.length == 0) {
                        this.archBody += ";";
                        continue;
                    }
                    else
                        this.archBody += ")\n";
                }
                this.archBody += "\t\t\tport map(";
                this.archBody += formatMap(connection.portMap);
                this.archBody += ");\n";
            }
            var vhdl = _super.prototype.toVhdl.call(this);
            return vhdl;
        };
        return VHDLCompositeArchitecture;
    })(VHDLArchitecture);
    VHDLFormatting.VHDLCompositeArchitecture = VHDLCompositeArchitecture;
    var VHDLConnection = (function () {
        function VHDLConnection(connectionName, connectingEntity, genericMap, portMap) {
            this.connectionName = connectionName;
            this.connectingEntity = connectingEntity;
            this.genericMap = genericMap;
            this.portMap = portMap;
        }
        return VHDLConnection;
    })();
    VHDLFormatting.VHDLConnection = VHDLConnection;
    var SVXConnection = (function (_super) {
        __extends(SVXConnection, _super);
        function SVXConnection(svxPort, connectingPort) {
            var genericMap = [];
            genericMap.push(new Map("signal_name", "\"" + svxPort.name + "\""));
            if (svxPort.valueType == "real") {
                genericMap.push(new Map("signal_precision", "single"));
                if (svxPort.IOType == "out") {
                    genericMap.push(new Map("trans_time", "1.0e-9"));
                }
            }
            var portMap = [];
            portMap.push(new Map((svxPort.valueType == "real" ? "qty" : "sig") + "_" + svxPort.IOType + "_0", connectingPort.name));
            var entityName = "SVX.SVX_VHDL_";
            if (svxPort.valueType == "real") {
                entityName += "REAL_QTY";
            }
            else if (svxPort.valueType == "boolean") {
                entityName += "BOOL";
            }
            else {
                entityName += svxPort.valueType.toUpperCase();
            }
            entityName += "_";
            if (svxPort.IOType == "out") {
                entityName += "CONS";
            }
            else if (svxPort.IOType == "in") {
                entityName += "GEN";
            }
            else {
                throw "Invalid port IO type " + svxPort.IOType;
            }
            entityName += "_1";
            _super.call(this, (svxPort.IOType == "in" ? "SEND_" : "RECEIVE_") + svxPort.name, entityName, genericMap, portMap);
        }
        return SVXConnection;
    })(VHDLConnection);
    VHDLFormatting.SVXConnection = SVXConnection;
    var Map = (function () {
        function Map(propertyName, propertyValue) {
            this.propertyName = propertyName;
            this.propertyValue = propertyValue;
        }
        return Map;
    })();
    VHDLFormatting.Map = Map;
    var VHDLPort = (function (_super) {
        __extends(VHDLPort, _super);
        function VHDLPort(name, portIOType, portValueType, quantityOrSignal) {
            _super.call(this, name, portIOType, portValueType);
            this.quantityOrSignal = quantityOrSignal;
        }
        return VHDLPort;
    })(SVXPort);
    VHDLFormatting.VHDLPort = VHDLPort;
    var VHDLSignal = (function () {
        function VHDLSignal(name, valueType, quantityOrSignal) {
            this.name = name;
            this.valueType = valueType;
            this.quantityOrSignal = quantityOrSignal;
        }
        return VHDLSignal;
    })();
    VHDLFormatting.VHDLSignal = VHDLSignal;
    var VHDLChunk = (function () {
        function VHDLChunk(contents) {
            this.chunk = contents;
        }
        VHDLChunk.prototype.toVhdl = function () {
            return this.chunk;
        };
        return VHDLChunk;
    })();
    VHDLFormatting.VHDLChunk = VHDLChunk;
    var VHDLLibraryUsing = (function () {
        function VHDLLibraryUsing(libraries) {
            this.libraries = libraries;
        }
        VHDLLibraryUsing.prototype.toVhdl = function () {
            var vhdl = "";
            for (var _i = 0, _a = this.libraries; _i < _a.length; _i++) {
                var library = _a[_i];
                vhdl += "library " + library.libraryName + ";\n";
                for (var _b = 0, _c = library.usings; _b < _c.length; _b++) {
                    var using = _c[_b];
                    vhdl += "use " + library.libraryName + "." + using + ".all;\n";
                }
            }
            return vhdl;
        };
        return VHDLLibraryUsing;
    })();
    VHDLFormatting.VHDLLibraryUsing = VHDLLibraryUsing;
})(VHDLFormatting || (VHDLFormatting = {}));
//# sourceMappingURL=VHDLTemplateFormatter.js.map