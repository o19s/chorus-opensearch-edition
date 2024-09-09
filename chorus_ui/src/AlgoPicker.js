import React, { Component } from 'react';
import Title from '../styles/Title';
import Container from '../styles/Container';
import {getClassName} from '@appbaseio/reactivecore/lib/utils/helper';

var UbiClient = require('.././ts/UbiClient.ts').UbiClient;
var Ubi = require('.././ts/UbiEvent.ts');

class AlgoPicker extends Component {
  
  writer = null;
  state = {
    value: 'keyword',
    selectedValue: 'keyword',
  };



  onChangeValue = (event) => {
    this.setState({
      value: event.target.value,
      selectedValue: event.target.value,
    });
    const selection = event.target.value;

    console.log('AlgoPicker.onChange ' + selection);

    if('ubi_client' in this.props){
      const ubi_client = this.props['ubi_client']
      const client_id = this.props['client_id'];
      const query_id = this.props['query_id'];
      const session_id = this.props['session_id'];
      let e = new Ubi.UbiEvent('algorithm', client_id, query_id);
      e.message = selection;
      e.message_type = 'ALGO'
      e.event_attributes['session_id'] = session_id;
      e.event_attributes.data = new Ubi.UbiEventData('change_algo', 'fake object id', ''. event);
      ubi_client.log_event(e);
    }
    else
      console.log('null writer');
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
          <option checked={this.state.selectedValue === "default"} value="default">Default (Keyword)</option>
          <option checked={this.state.selectedValue === "neural_only"} value="neural_only">Neural Only</option>
          <option checked={this.state.selectedValue === "hybrid"} value="hybrid">Hybrid</option>          
        </select>
      </Container>
    )
  }
}

export default AlgoPicker;
