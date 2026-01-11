import React, { Component } from "react";
import Title from "../styles/Title";
import Container from "../styles/Container";
import { getClassName } from "@appbaseio/reactivecore/lib/utils/helper";
import axios from "axios";

class AlgoPicker extends Component {
  state = {
    selectedAlgo: "keyword",
    showTextBox: false,
    showConfigDropdown: false,
    conf_a: undefined,
    conf_b: undefined,
    selectedConfig: "",
    availableConfigs: [],
    configError: null,
  };

  // Wait until the component is mounted to fetch the search configurations
  componentDidMount() {
    this.fetchSearchConfigurations();
  }

  fetchSearchConfigurations = async () => {
    try {
      const serverUrl = this.props.eventServer || "http://localhost:9090";
      const response = await axios.get(`${serverUrl}/search_configurations`);
      if (response.data) {
        if (response.data.error) {
          // API returned an error message
          this.setState({
            availableConfigs: [],
            configError: response.data.error,
          });
        } else if (response.data.configs) {
          this.setState({
            availableConfigs: response.data.configs,
            configError: null,
          });
        } else {
          this.setState({
            availableConfigs: [],
            configError: "No configurations found in response",
          });
        }
      }
    } catch (error) {
      console.error("Error fetching search configurations:", error);
      const errorMessage = error.response?.data?.error || error.message || "Failed to fetch search configurations";
      this.setState({
        availableConfigs: [],
        configError: errorMessage,
      });
    }
  };

  onChangeValue = (event) => {
    const selectedValue = event.target.value;
    this.setState({
      selectedAlgo: selectedValue,
      showTextBox: selectedValue === "ab",
      showConfigDropdown: selectedValue === "other",
      // Reset selected config when switching away from "other"
      selectedConfig: selectedValue === "other" ? this.state.selectedConfig : "",
    });
    console.log(this);
    
    // Notify parent component of algorithm change
    if (this.props.onAlgoChange) {
      this.props.onAlgoChange(selectedValue);
    }
  };

  onChangeConfA = (event) => {
    this.setState({
      conf_a: event.target.value,
    });
  };

  onChangeConfB = (event) => {
    this.setState({
      conf_b: event.target.value,
    });
  };

  onChangeConfig = (event) => {
    this.setState({
      selectedConfig: event.target.value,
    });
  };

  render() {
    return (
      <Container style={this.props.style} className={this.props.className}>
        {this.props.title && (
          <Title
            className={getClassName(this.props.innerClass, "title") || null}
          >
            {this.props.title}
          </Title>
        )}
        <select
          value={this.state.selectedAlgo}
          onChange={this.onChangeValue}
          style={{ display: "flex", flexDirection: "column" }}
          id="algopicker"
        >
          <option value="keyword">Keyword</option>
          <option value="neural">Neural</option>
          <option value="hybrid">Hybrid</option>
          <option value="ab">AB</option>
          <option value="art_controlled">ART Controlled</option>
          <option value="other">Other Config</option>
        </select>
        {this.state.showTextBox && (
          <>
            <label>
              {" "}
              Configuration A:{" "}
              <input
                type="text"
                name="Search Config A"
                id="conf_a"
                value={this.state.conf_a}
                onChange={this.onChangeConfA}
              />
            </label>
            <br />
            <label>
              {" "}
              Configuration B:{" "}
              <input
                type="text"
                name="Search Config B"
                id="conf_b"
                value={this.state.conf_b}
                onChange={this.onChangeConfB}
              />
            </label>
          </>
        )}
        {this.state.showConfigDropdown && (
          <>
            <label>
              {" "}
              Select Configuration:{" "}
              <select
                id="other_config"
                value={this.state.selectedConfig}
                onChange={this.onChangeConfig}
                style={{ display: "flex", flexDirection: "column" }}
                disabled={this.state.configError !== null}
              >
                <option value="">-- Select a configuration --</option>
                {this.state.availableConfigs.map((config) => (
                  <option key={config} value={config}>
                    {config}
                  </option>
                ))}
              </select>
            </label>
            {this.state.configError && (
              <div style={{ color: "red", marginTop: "5px", fontSize: "12px" }}>
                Error: {this.state.configError}
              </div>
            )}
          </>
        )}
      </Container>
    );
  }
}

export default AlgoPicker;
