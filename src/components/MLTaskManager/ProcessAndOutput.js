import React from 'react'
import { observer } from 'mobx-react'
import { parse } from 'json2csv'
import streamSaver from 'streamsaver'

import AppContext from '@store'
import { ASYNC_STATES, stopEvent } from '@util'

class ProcessAndOutput extends React.Component {
  constructor (props) {
    super(props)
  }
  
  render () {
    const mlTask = this.context.mlTask
    const mlResults = this.context.mlResults
    const mlSelection = this.context.mlSelection
    
    // If the results aren't ready, don't render this component.
    if (mlTask.status !== ASYNC_STATES.SUCCESS || mlResults.status !== ASYNC_STATES.SUCCESS) {
      return null
    }
    
    return (
      <form className="form" onSubmit={(e) => { return stopEvent(e) }}>
        <h2>Process Selected Images</h2>
        <div className="info panel">
          You have selected {mlSelection.selection.length} images to process. You have a choice to...
        </div>
        <fieldset>
          <button
            className="action button"
            onClick={this.doExport.bind(this)}
          >
            Export to CSV
          </button>
        </fieldset>
            
        <fieldset>
          <button
            className="action button"
            onClick={this.doRetire.bind(this)}
          >
            Retire
          </button>
        </fieldset>
      </form>
    )
  }
  
  doExport () {
    const mlSelection = this.context.mlSelection
    const selection = mlSelection.selection.toJSON()
    let csvData = ''
    if (selection.length > 0) csvData = parse(selection, {})
    
    const fileStream = streamSaver.createWriteStream('subject-assistant.csv', {})
    
    const onSuccess = () => { console.log('EXPORT SUCCESS') }
    const onError = () => { console.error('EXPORT ERROR') }
    
    new Response(csvData).body.pipeTo(fileStream).then(onSuccess, onError)
  }

  doRetire () {
    const workflowOutput = this.context.workflowOutput
    const mlSelection = this.context.mlSelection
    const selection = mlSelection.selection.toJSON() || []
    const subjectIds = getUniqueSubjectIds(selection)
    
    workflowOutput.retire(subjectIds)
  }
}

function getUniqueSubjectIds (selection) {
  if (!selection) return []
  return selection
  .map(image => image.meta && image.meta.subject_id)
  .filter((subject_id, index, arr) => arr.indexOf(subject_id) === index)
}

ProcessAndOutput.contextType = AppContext

export default observer(ProcessAndOutput)
