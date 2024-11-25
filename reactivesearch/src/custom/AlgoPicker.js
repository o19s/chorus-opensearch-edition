import React, { Component } from 'react';
import Title from '../styles/Title';
import Container from '../styles/Container';
import {getClassName} from '@appbaseio/reactivecore/lib/utils/helper';


class AlgoPicker extends Component {
  state = {
    algo: 'keyword',
    selectedValue: 'keyword',
  };

  onChangeValue = (event) => {
    this.setState({
      algo: event.target.value,
      selectedValue: event.target.value,
    });
    console.log(this);

  };

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
        </select>
      </Container>
    )
  }
}

export default AlgoPicker;
