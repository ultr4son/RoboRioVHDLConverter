var RoboRioVHDLResource;
(function (RoboRioVHDLResource) {
    //Naming Scheme:
    //IO ports on symbol and SVX port names are the same
    //PWM wires in the entity are prefixed by "qToPWM" 
    //Encoder wires in the entity are prefixed by "encoderCounts" and "encoderReverse"
    //Encoders are split to have the name of the port and the A pin or B pin number
    function architectureHeader() {
        return "library SVX;\n\
library IEEE;\n\
use IEEE.numeric_std.all;\n\
use SVX.SVX_Resources.all;\n\
architecture default of RoboRio is\n";
    }
    RoboRioVHDLResource.architectureHeader = architectureHeader;
    function architectureEnd() {
        return "end architecture default;\n";
    }
    RoboRioVHDLResource.architectureEnd = architectureEnd;
    function beginAndSVX() {
        return "begin \n\
        target: entity SVX.SVX_TARGET; \n\
        socket: entity SVX.SVX_CONN_SOCK;\n";
    }
    RoboRioVHDLResource.beginAndSVX = beginAndSVX;
    function signalPWM(pwmFullName) {
        return "quantity " + qToPWMWireName(pwmFullName) + ":real;\n";
    }
    RoboRioVHDLResource.signalPWM = signalPWM;
    function encoderCountsWireName(encoderFullName) {
        return "encoderCounts" + encoderFullName;
    }
    RoboRioVHDLResource.encoderCountsWireName = encoderCountsWireName;
    function encoderReverseWireName(encoderCountsFullName) {
        return "reverseEncoder" + encoderCountsFullName.replace("COUNTS", "REVERSE");
    }
    RoboRioVHDLResource.encoderReverseWireName = encoderReverseWireName;
    function qToPWMWireName(pwmFullName) {
        return "qToPWM" + pwmFullName;
    }
    RoboRioVHDLResource.qToPWMWireName = qToPWMWireName;
    function signalEncoderCounts(encoderFullName) {
        return "signal " + encoderCountsWireName(encoderFullName) + ":real;\n";
    }
    RoboRioVHDLResource.signalEncoderCounts = signalEncoderCounts;
    function signalEncoderReverse(encoderFullName) {
        return "signal " + encoderReverseWireName(encoderFullName) + ": boolean;\n";
    }
    RoboRioVHDLResource.signalEncoderReverse = signalEncoderReverse;
    function wireBooleanConsumer(signalName, wireTo) {
        return "get" + signalName + ": entity SVX.SVX_VHDL_BOOL_CONS_1 \n\
        generic map (signal_name =>" + " \"" + signalName + "\") \n\
        port map(sig_out_0 =>" + wireTo + ");\n";
    }
    RoboRioVHDLResource.wireBooleanConsumer = wireBooleanConsumer;
    function wireBooleanGenerator(signalName, wireTo) {
        return "send" + signalName + ": entity SVX.SVX_VHDL_BOOL_GEN_1 \n\
        generic map (signal_name =>" + " \"" + signalName + "\"" + ")\n\
        port map(sig_in_0 =>" + wireTo + ");\n";
    }
    RoboRioVHDLResource.wireBooleanGenerator = wireBooleanGenerator;
    function wireRealConsumer(signalName, wireTo) {
        return "get" + signalName + ": entity SVX.SVX_VHDL_REAL_CONS_1 \n\
        generic map (signal_name =>" + "\"" + signalName + "\"" + ",signal_precision => single, trans_time => 1.0e-9) \n\
        port map(sig_out_0 =>" + wireTo + ");\n";
    }
    RoboRioVHDLResource.wireRealConsumer = wireRealConsumer;
    function wireRealGenerator(signalName, wireTo) {
        return "send" + signalName + ": entity SVX.SVX_VHDL_REAL_GEN_1 \n\
        generic map (signal_name =>" + "\"" + signalName + "\"" + ",signal_precision => single) \n\
        port map(sig_in_0 =>" + wireTo + ");\n";
    }
    RoboRioVHDLResource.wireRealGenerator = wireRealGenerator;
    function wireRealQtyConsumer(signalName, wireTo) {
        return "get" + signalName + ": entity SVX.SVX_VHDL_REAL_QTY_CONS_1 \n\
        generic map (signal_name =>" + "\"" + signalName + "\"" + ",signal_precision => single, trans_time => 1.0e-9) \n\
        port map(qty_out_0 =>" + wireTo + ");\n";
    }
    RoboRioVHDLResource.wireRealQtyConsumer = wireRealQtyConsumer;
    function wireEncoder(encoderFullName) {
        var vhdl = "";
        var encoderWires = splitEncoderName(encoderFullName);
        var reverseName = encoderFullName.replace("COUNTS", "REVERSE");
        vhdl += wireBooleanConsumer(reverseName, encoderReverseWireName(encoderFullName));
        vhdl += "calculateCounts" + encoderFullName + ": entity WORK.encoder_counter_sampled \n\
        port map(d_in_1 =>" + encoderWires.aPort + ", \n\
        d_in_2 =>" + encoderWires.bPort + ", \n\
        encoder_count => " + encoderCountsWireName(encoderFullName) + ",\n\
        reverse_counts => " + encoderReverseWireName(reverseName) + ");\n"; // Wire up the counting part
        vhdl += wireRealGenerator(encoderFullName, encoderCountsWireName(encoderFullName)); //Wire up the sending part
        return vhdl;
    }
    RoboRioVHDLResource.wireEncoder = wireEncoder;
    function wirePWM(pwmFullName) {
        var vhdl = "";
        vhdl += "calculatePWM" + pwmFullName + ": entity WORK.q_to_servo_pwm \n\
        port map(input => " + qToPWMWireName(pwmFullName) + ",\n\
        pwm_out => " + pwmFullName + ");\n";
        vhdl += wireRealQtyConsumer(pwmFullName, qToPWMWireName(pwmFullName));
        return vhdl;
    }
    RoboRioVHDLResource.wirePWM = wirePWM;
    function commentHeader() {
        return "------------------------------------------------------------------------------- \n\
--Model Title: RoboRio\n\
--Entity Name: RoboRio \n\
--Author: Enter name here  \n\
--Created: 7 / 12 / 2016 4:00 pm \n\
--Last update: \n\
------------------------------------------------------------------------------- \n\
--Description: I am a costom generated RoboRio!  \n\
--  \n\
--I was made from a manifest.Edit the manifest and reupload it to update me.\n\
-------------------------------------------------------------------------------\n";
    }
    RoboRioVHDLResource.commentHeader = commentHeader;
    function encoder() {
        return "library IEEE; \n\
use IEEE.std_logic_1164.all; \n\
use IEEE.numeric_std.all; \n\
    \n\
entity encoder_counter_sampled is \n\
    generic (sample_period : real := 25.0e-3; -- Sample period [secs] \n\
            initial_state : integer := 3-- Initial state of encoder inputs, expressed as an integer (e.g. default = 3 implies d_in_1 = '1' and d_in_2 = '1') \n\
            ); \n\
    port (signal d_in_1, d_in_2 : in std_logic;  -- Digital index sensor inputs \n\
        signal encoder_count : out real := 0.0;  -- Encoder count output \n\
        signal reverse_counts: in boolean := false); \n\
end entity encoder_counter_sampled; \n\
    \n\
architecture default of encoder_counter_sampled is \n\
    signal count : real:=0.0; \n\
    \n\
begin \n\
        \n\
    process is \n\
    variable d_in_1_value, d_in_2_value : integer := 0; \n\
    variable last_state : integer := initial_state; \n\
    variable new_state  : integer := initial_state; \n\
    \n\
    begin \n\
    \n\
    wait until domain = time_domain; \n\
        \n\
    loop \n\
        \n\
  	    wait until d_in_1'event or d_in_2'event; \n\
  	        \n\
  	    last_state := new_state; \n\
  	    \n\
  	    if d_in_1 = '1' then \n\
        if(reverse_counts) then \n\
            d_in_1_value := 0; \n\
		else \n\
  	    	d_in_1_value := 1; \n\
        end if; \n\
  	    else \n\
		if(reverse_counts) then \n\
            d_in_1_value := 1; \n\
		else \n\
  	    	d_in_1_value := 0; \n\
        end if; \n\
        end if; \n\
        \n\
        if d_in_2 = '1' then \n\
        if(reverse_counts) then \n\
            d_in_2_value := 0; \n\
        else \n\
            d_in_2_value := 1; \n\
        end if; \n\
  	    else \n\
		if(reverse_counts) then \n\
            d_in_2_value := 1; \n\
        else \n\
            d_in_2_value := 0; \n\
        end if;       \n\
        end if; \n\
        \n\
        new_state := d_in_1_value*2 + d_in_2_value; \n\
        \n\
        case last_state is \n\
  	    when 0 => \n\
  	        if new_state = 1 then \n\
            count <= count - 1.0; \n\
            elsif new_state = 2 then \n\
            count <= count + 1.0; \n\
            end if; \n\
        when 1 => \n\
  	        if new_state = 3 then \n\
            count <= count - 1.0; \n\
            elsif new_state = 0 then \n\
            count <= count + 1.0; \n\
            end if; \n\
        when 2 => \n\
  	        if new_state = 0 then \n\
            count <= count - 1.0; \n\
            elsif new_state = 3 then \n\
            count <= count + 1.0; \n\
            end if; \n\
        when 3 => \n\
  	        if new_state = 2 then \n\
            count <= count - 1.0; \n\
            elsif new_state = 1 then \n\
            count <= count + 1.0; \n\
            end if; \n\
        when others => \n\
            count <= count;  --- Do nothing, invalid state \n\
        end case; \n\
    end loop;  \n\
    end process; \n\
        \n\
    encoder_count <= count; \n\
    \n\
end architecture default;\n\n";
    }
    RoboRioVHDLResource.encoder = encoder;
    function qToPWM() {
        return "library IEEE;  \n\
use IEEE.std_logic_1164.all;  \n\
entity q_to_servo_pwm is \n\
    generic (initial_delay : time := 0 ns;     -- Delay Time [Sec] \n\
            period        : time := 20 ms;    -- Period [Sec] \n\
            duty_zero     : real := 1.5E-3;   -- Pulse width that corresponds to dutycycle of zero \n\
            duty_range    : real := 0.5E-3);  -- Pulse width delta corresponding to dutycycle +/- 1 \n\
    \n\
    port (quantity input  : in  real; \n\
                    pwm_out : out std_logic); \n\
end entity q_to_servo_pwm; \n\
    \n\
    \n\
architecture default of q_to_servo_pwm is \n\
    \n\
    signal   out_signal : std_logic; \n\
    \n\
begin \n\
    \n\
-- purpose: Creates pulse width on signal  \"out_signal \" as a function of input dutycycle \n\
    CreateEvent : process \n\
    variable width, off_time : time := 0 ns; \n\
    variable width_calc : real := 0.0; \n\
    constant max_width : real := duty_zero + duty_range;\
    constant min_width : real := duty_zero - duty_range;\
    begin\
        out_signal <= '0';\
        wait for initial_delay; \n\
	loop \n\
        out_signal <= '1'; \n\
        width_calc := duty_zero+(input*duty_range); \n\
        if width_calc > max_width then \n\
  	        width_calc := max_width; \n\
  	        elsif width_calc < min_width then \n\
  	        width_calc := min_width; \n\
        end if; \n\
        width := width_calc * 1 sec; \n\
        off_time := period - width; \n\
        wait for width; \n\
        out_signal <= '0'; \n\
        wait for off_time; \n\
    end loop; \n\
    end process CreateEvent; \n\
    \n\
    pwm_out <= out_signal; \n\
    \n\
end architecture default;\n\n";
    }
    RoboRioVHDLResource.qToPWM = qToPWM;
    function roboRioEntityHeader() {
        return "library IEEE; \n\
use IEEE.std_logic_1164.all; \n\n\
entity RoboRio is \n";
    }
    RoboRioVHDLResource.roboRioEntityHeader = roboRioEntityHeader;
    function roboRioEntity(contents) {
        return roboRioEntityHeader() + contents + endRoboRioEntity();
    }
    RoboRioVHDLResource.roboRioEntity = roboRioEntity;
    function splitEncoders(aPortName, bPortName) {
        var vhdl = "";
        vhdl += aPortName + ":in std_logic";
        vhdl += bPortName + ":in std_logic";
        return vhdl;
    }
    RoboRioVHDLResource.splitEncoders = splitEncoders;
    function splitEncoderName(fullName) {
        var aPortSplit = fullName.split("_"); //Split up the port name and numbers
        var bPortNumber = aPortSplit.pop(); //We only want the first port number for a, b is the second number
        var bPortSplit = aPortSplit; //Save the resulting string array for more manipulation
        var aPortName = aPortSplit.join("_"); //aPortName is formed
        bPortSplit.pop(); //Remove aPort's number
        bPortSplit.push(bPortNumber); //Append bPort's number
        var bPortName = bPortSplit.join("_"); //bPort is formed
        return {
            aPort: aPortName,
            bPort: bPortName
        };
    }
    RoboRioVHDLResource.splitEncoderName = splitEncoderName;
    function roboRioPorts(ports) {
        var vhdl = "port(";
        for (var i = 0; i < ports.length; i++) {
            var port = ports[i];
            //Externally, encoders have two ports
            var portSplit = port.name.split("_");
            if (portSplit[0] == "ENCODER") {
                if (portSplit[1] == "COUNTS") {
                    var splitPorts = splitEncoderName(port.name);
                    vhdl += splitPorts.aPort + ":in std_logic;\n";
                    vhdl += splitPorts.bPort + ":in std_logic;\n";
                    continue;
                }
                else if (portSplit[1] == "REVERSE") {
                    continue; //Internal port. Ignore for now.
                }
            }
            if (i > 1) {
                vhdl += "\t";
            }
            else {
                vhdl += "signal ";
            }
            vhdl += port.name + ":";
            vhdl += port.portIOType + " ";
            if (port.portValueType == "boolean") {
                vhdl += "std_logic";
            }
            else {
                vhdl += port.portValueType;
            }
            vhdl += ";\n";
        }
        vhdl += ");\n";
        vhdl = vhdl.replace(/;\n\)/g, ")"); //Slightly scruffy way of making sure there isn't a semicolon leading the last port definition.
        return vhdl;
    }
    RoboRioVHDLResource.roboRioPorts = roboRioPorts;
    function endRoboRioEntity() {
        return "end entity RoboRio;\n";
    }
    RoboRioVHDLResource.endRoboRioEntity = endRoboRioEntity;
})(RoboRioVHDLResource || (RoboRioVHDLResource = {}));
//# sourceMappingURL=RoboRioVHDLTemplate.js.map