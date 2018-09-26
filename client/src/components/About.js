import React, { Component } from 'react'
import Widget from '../components/Widget'

export default class About extends Component {
  render () {
    return (
      <Widget title={this.props.title} icon={this.props.icon}>
          <p>Gource is a real-time visualisation of the Cardano project. It acts like &quot;living artwork&quot; where you can view the entire project history.
          Explore the enormous engineering work going on behind the scenes along with the active involvement of the community.</p>
      </Widget>
    )
  }
}
