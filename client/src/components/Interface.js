import React, { Component } from 'react'

export default class Interface extends Component {
  render () {
    return (
      <Widget title={this.props.title}>
        <div className='head'>
          <a target='_blank'><em className='fa fa-github' /></a>
          <h3>Gource project explorer</h3>
          <small>Github project activity live</small>
        </div>
        <div className='info'>
          <div className='inner'>
            <p>Gource is a real-time visualisation of the Cardano project. It acts like &quot;living artwork&quot; where you can view the entire project history.
                Explore the enormous engineering work going on behind the scenes along with the active involvement of the community.</p>
          </div>
        </div>
      </Widget>
    )
  }
}
