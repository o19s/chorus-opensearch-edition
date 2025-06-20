import React, { Component } from 'react';
import Title from '../styles/Title';
import Container from '../styles/Container';
import {getClassName} from '@appbaseio/reactivecore/lib/utils/helper';


class AlgoPicker extends Component {
  state = {
    algo: 'keyword',
    selectedValue: 'keyword',
    showTextBox: false,
    conf_a: undefined,
    conf_b: undefined
  };
  onChangeValue = (event) => {
    this.setState({
      algo: event.target.value,
      selectedValue: event.target.value,
      showTextBox: (event.target.value === "ab")
    });
    console.log(this);
  };
  onChangeConfA = (event) => {
    this.setState({
        conf_a: event.target.value
    });
  }
   onChangeConfB = (event) => {
     this.setState({
         conf_b: event.target.value
     });
   }

  render() {
    return (
      <Container style={this.props.style} className={this.props.className}>
				{this.props.title && (
					<Title className={getClassName(this.props.innerClass, 'title') || null}>
						{this.props.title}
					</Title>
				)}
        <select value={this.state.selectedValue} onChange={this.onChangeValue} style={{display: "flex", flexDirection: "column"}} id="algopicker">
          <option checked={this.state.selectedValue === "keyword"} value="keyword">Keyword</option>
          <option checked={this.state.selectedValue === "neural"} value="neural">Neural</option>
          <option checked={this.state.selectedValue === "hybrid"} value="hybrid">Hybrid</option>
          <option checked={this.state.selectedValue === "ab"} value="ab">AB</option>
        </select>
        {this.state.showTextBox && (<><label> Configuration A: <input type="text" name="Search Config A" id="conf_a" value={this.state.conf_a} onChange={this.onChangeConfA}/></label><br />
        <label> Configuration B: <input type="text" name="Search Config B" id="conf_b" value={this.state.conf_b} onChange={this.onChangeConfB}/></label></>)}
      </Container>
    )
  }
}

export default AlgoPicker;
