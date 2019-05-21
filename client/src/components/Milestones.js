import React, { Component } from 'react'
import Widget from '../components/Widget'
import renderHTML from 'react-render-html'

export default class Milestones extends Component {
  render () {
    return (
      <Widget title='Milestones' slug='milestones' icon={this.props.icon} list={'true'}>
        <div>{renderHTML(this.props.config.widget.milestones.content)}</div>
      </Widget>
    )
  }
}
