import React, { Component } from 'react'

export default class Controls extends Component {
  //
  // <div className='sidebar'>
  //   <div className='switcher play--switcher'>
  //     <b>Autoplay</b>
  //     <a className='play' onClick={() => { this.props.setPlay(true) }}>
  //         Play
  //     </a>
  //     <a className='stop' onClick={() => { this.props.setPlay(false) }}>
  //         Stop
  //     </a>
  //   </div>
  //   <div className='switcher view--switcher'>
  //     <b>Display mode</b>
  //     <div className='inner'>
  //       <a className={this.props.spherize === true ? 'view-selected sphere' : 'sphere'} onClick={() => { this.props.setSphereView(true) }}>Sphere</a>
  //       <a className={this.props.spherize === false ? 'view-selected normal' : 'normal'} onClick={() => { this.props.setSphereView(false) }}>Graph</a>
  //     </div>
  //   </div>
  // </div>

  render () {
    return (
      <div className='slider'>
        <button className='playpause border-0 bg-transparent d-block d-md-inline-block'><span className='icon-control-play text-secondary' /></button>
        <button className='prev border-0 bg-transparent'><span className='icon-control-rewind text-secondary' /></button>
        {this.props.children}
      </div>
    )
  }
}
