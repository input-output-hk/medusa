import React, { Component } from 'react'

export default class Controls extends Component {
  render () {
    return (
      <div className='sidebar'>
        <div className='inner'>
          <div className='pane main'>
            <div className='head'>
              <a target='_blank'><em className='fa fa-github' /></a>
              <h3>Gource project explorer</h3>
              <small>Github project activity live</small>
            </div>
            <div className='info'>
              <div className='inner'>
                <p>Gource is a real-time visualisation of the Cardano project. It acts like &quot;living artwork&quot; where you can view the entire project history.
                    Explore the enormous engineering work going on behind the scenes along with the active involvement of the community.</p>
                <div className='switcher play--switcher'>
                  <b>Autoplay</b>
                  <a className='play' onClick={() => { this.props.setPlay(true) }}>
                      Play
                  </a>
                  <a className='stop' onClick={() => { this.props.setPlay(false) }}>
                      Stop
                  </a>
                </div>
                <div className='switcher view--switcher'>
                  <b>Display mode</b>
                  <div className='inner'>
                    <a className={this.props.spherize === true ? 'view-selected sphere' : 'sphere'} onClick={() => { this.props.setSphereView(true) }}>Sphere</a>
                    <a className={this.props.spherize === false ? 'view-selected normal' : 'normal'} onClick={() => { this.props.setSphereView(false) }}>Graph</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}
