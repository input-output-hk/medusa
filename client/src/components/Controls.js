import React, { Component } from 'react'

export default class Controls extends Component {
  render () {
    return (
      <div className='gource-controls'>
        <button className='previousCommit' onClick={this.props.goToPrev}>&lt; Prev</button>
        <button className='nextCommit' onClick={this.props.goToNext}>Next &gt;</button>
        <label>
        Play:
          <input
            name='play'
            type='checkbox'
            checked={this.props.play}
            onChange={this.props.togglePlay} />
        </label>
        <label>
        Commit:
          <input
            ref={input => {
              this.commitInput = input
            }}
            name='commitInput'
            type='text' />
          <button onClick={() => { this.props.loadCommit(this.commitInput.value.trim()) }}>Go</button>
        </label>
        <label>
        Sphere Projection:
          <input
            name='spherize'
            type='checkbox'
            checked={this.props.spherize}
            onChange={this.props.toggleSpherize} />
        </label>
      </div>
    )
  }
}
