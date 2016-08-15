module VHDLFormatting {
    function formatMap(mapping: Map[]): string {
        var formatting: string[] = [];

        for (var map of mapping) {
            formatting.push(map.propertyName + "=>" + map.propertyValue);

        }
        return formatting.join(",");
    }
    function formatVHDLPort(ports: VHDLPort[]): string {
        var formatting: string[] = [];

        for (var port of ports) {
            formatting.push(port.quantityOrSignal + " " + port.name + ":" + port.IOType + " " + port.valueType);
        }
        return formatting.join(";\n");
    }
    interface VHDLConvertable {
        toVhdl(): string;
    }
    interface VHDLBody {
        header: VHDLConvertable;
    }
    export class VHDLFile implements VHDLConvertable, VHDLBody {
        header: VHDLConvertable;
        entities: (VHDLEntity | VHDLChunk)[];
        architectures: (VHDLArchitecture | VHDLChunk)[];
        public toVhdl(): string {
            var vhdl = this.header.toVhdl();
            for (var entity of this.entities) {
                vhdl += entity.toVhdl() + "\n";
            }
            for (var architecture of this.architectures) {
                vhdl += architecture.toVhdl() + "\n";
            }
            return vhdl;
        }
        constructor(entities: (VHDLEntity | VHDLChunk)[], architectures: (VHDLArchitecture | VHDLChunk)[], header?: VHDLConvertable) {
            this.header = header || new VHDLChunk("");
            this.entities = entities;
            this.architectures = architectures;
        }
    }
    export class VHDLCommentHeader implements VHDLConvertable {
        private getCreated(): string {
            var date = new Date()
            var hours = date.getHours();
            var hours12 = hours > 12 ? hours - 12 : hours; //date.getHours() gives 24 hour time
            //Make sure there are leading zeros where appropriate
            return ('0' + (date.getMonth() + 1)).slice(-2) + "/" + ('0' + date.getDate()).slice(-2) + "/" + date.getFullYear() + " " + ('0' + hours12).slice(-2) + ":" + ('0' + date.getMinutes()).slice(-2);
        }
        private comment(content: string): string {
            return "--" + content + "\n";
        }
        private commentSeparator(): string {
            return "-------------------------------------------------------------------------------\n";
        }
        modelTitle: string;
        entityName: string;
        author: string;
        created: string;
        description: string;
        public toVhdl(): string {
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
        }
        constructor(modelTitle: string, author: string, description: string);
        constructor(modelTitle: string, entityName: string, author: string, description: string);
        constructor(modelTitle: string, author: string, description: string, entityName?: string, created?: string) {
            this.modelTitle = modelTitle;
            this.entityName = entityName || modelTitle;
            this.author = author;
            this.created = created || this.getCreated();
            this.description = description;
        }
    }
    export class VHDLEntity implements VHDLConvertable, VHDLBody {
        header: VHDLConvertable;
        entityName: string;
        protected entityBody: string;
        public toVhdl(): string {
            var vhdl = this.header.toVhdl();
            vhdl += "entity " + this.entityName + " is\n";
            vhdl += this.entityBody;
            vhdl += "end entity " + this.entityName + ";";
            return vhdl;
        }
        constructor(entityName: string, entityBody?: string, header?: VHDLConvertable) {
            this.entityName = entityName;
            this.entityBody = entityBody || "";
            this.header = header || new VHDLChunk("");
        }
    }
    export class VHDLCompositeEntity extends VHDLEntity implements VHDLConvertable {
        generic: VHDLPort[];
        ports: VHDLPort[];
        public toVhdl(): string {

            //VHDL doesn't like empty things
            this.entityBody += this.generic.length > 0 ? "\tgeneric(" + formatVHDLPort(this.generic) + ");\n" : "";
            this.entityBody += this.ports.length > 0 ? "\tport(" + formatVHDLPort(this.ports) + ");\n": "";

            return super.toVhdl();
        }
        constructor(entityName: string, header?: VHDLConvertable) {
            super(entityName, "", header);
            this.generic = [];
            this.ports = [];
        }
    }
    export class VHDLArchitecture implements VHDLConvertable, VHDLBody {
        header: VHDLConvertable;
        entityName: string;
        protected archBody: string;
        public toVhdl(): string {
            var vhdl = this.header.toVhdl();
            vhdl += "architecture default of " + this.entityName + " is\n";
            vhdl += this.archBody
            vhdl += "end architecture default;"
            return vhdl;
        }
        public constructor(entityName: string, archBody?: string, header?: VHDLConvertable) {
            this.header = header || new VHDLChunk("");
            this.entityName = entityName;
            this.archBody = archBody || "";
        }
    }
    export class VHDLCompositeArchitecture extends VHDLArchitecture implements VHDLConvertable {

        signals: VHDLSignal[] = [];
        connections: VHDLConnection[] = [];
        constructor(entityName: string, header?: VHDLConvertable) {
            super(entityName, "", header);

        }
        public toVhdl(): string {

            for (var port of this.signals) {
                this.archBody += port.quantityOrSignal + " " + port.name + ": " + port.valueType + ";\n";
            }
            this.archBody += "\tbegin\n";
            for (var connection of this.connections) {
                this.archBody += "\t\t" + connection.connectionName + ": entity " + connection.connectingEntity + "\n";
                if (connection.genericMap.length > 0) {
                    this.archBody += "\t\t\tgeneric map(";

                    this.archBody += formatMap(connection.genericMap);

                    if (connection.portMap.length == 0) {
                        this.archBody += ";"
                        continue;
                    }
                    else this.archBody += ")\n"
                }
                this.archBody += "\t\t\tport map("
                this.archBody += formatMap(connection.portMap);
                this.archBody += ");\n";
            }
            var vhdl = super.toVhdl();
            return vhdl;
        }

    }

    export class VHDLConnection {
        connectionName: string;
        connectingEntity: string;
        genericMap: Map[];
        portMap: Map[];
        constructor(connectionName: string, connectingEntity: string, genericMap: Map[], portMap: Map[]) {
            this.connectionName = connectionName;
            this.connectingEntity = connectingEntity;
            this.genericMap = genericMap;
            this.portMap = portMap;
        }
    }
    export class SVXConnection extends VHDLConnection {
        constructor(svxPort: SVXPort, connectingPort: SVXPort | VHDLSignal) {
            var genericMap: Map[] = [];
            genericMap.push(new Map("signal_name", "\"" + svxPort.name + "\""));
            if (svxPort.valueType == "real") {
                genericMap.push(new Map("signal_precision", "single"));
                if (svxPort.IOType == "out") {
                    genericMap.push(new Map("trans_time", "1.0e-9"));
                }
            }
            var portMap: Map[] = [];
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
            entityName += "_1"

            super((svxPort.IOType == "in" ? "SEND_" : "RECEIVE_") + svxPort.name, entityName, genericMap, portMap);
        }
    }
    export class Map {
        propertyName: string;
        propertyValue: string;
        constructor(propertyName: string, propertyValue: string) {
            this.propertyName = propertyName;
            this.propertyValue = propertyValue;
        }
    }
    export class VHDLPort extends SVXPort {
        quantityOrSignal: string;
        constructor(name: string, portIOType: string, portValueType: string, quantityOrSignal: string) {
            super(name, portIOType, portValueType);
            this.quantityOrSignal = quantityOrSignal;
        }
    }
    export class VHDLSignal {
        quantityOrSignal: string
        name: string;
        valueType: string;
        constructor(name: string, valueType: string, quantityOrSignal: string) {
            this.name = name;
            this.valueType = valueType;
            this.quantityOrSignal = quantityOrSignal;
        }
    }
    export class VHDLChunk implements VHDLConvertable {
        chunk: string;
        public toVhdl(): string {
            return this.chunk;
        }
        constructor(contents: string) {
            this.chunk = contents;
        }
    }
    export class VHDLLibraryUsing implements VHDLConvertable {
        libraries: { libraryName: string, usings: string[] }[]
        public toVhdl(): string {
            var vhdl = "";
            for (var library of this.libraries) {
                vhdl += "library " + library.libraryName + ";\n";
                for (var using of library.usings) {
                    vhdl += "use " + library.libraryName + "." + using + ".all;\n";
                }
            }
            return vhdl;
        }
        public constructor(libraries: { libraryName: string, usings: string[] }[]) {
            this.libraries = libraries;
        }
    }
}