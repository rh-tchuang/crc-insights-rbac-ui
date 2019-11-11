import React, { Fragment, useState } from 'react';
import { connect } from 'react-redux';
import { mappedProps } from '../../../helpers/shared/helpers';
import PropTypes from 'prop-types';
import { Link, Route } from 'react-router-dom';
import { expandable } from '@patternfly/react-table';
import { TableToolbarView } from '../../../presentational-components/shared/table-toolbar-view';
import { createRows } from './policy-table-helpers';
import { fetchGroupPolicies, removePolicy } from '../../../redux/actions/policy-actions';
import { ListLoader } from '../../../presentational-components/shared/loader-placeholders';
import { defaultSettings } from '../../../helpers/shared/pagination';
import { Button, ToolbarGroup, ToolbarItem } from '@patternfly/react-core';
import AddGroupPolicy from './policy-actions/add-policy-wizard';
import EditPolicyInfo from './policy-actions/edit-policy-info';
import EditPolicyRoles from './policy-actions/edit-policy-roles';
import { PolicyActionsDropdown } from './policy_action_dropdown';
import { Section } from '@redhat-cloud-services/frontend-components';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/';
import debouncePromise from '@redhat-cloud-services/frontend-components-utilities/files/debounce';

const debouncedFetch = debouncePromise(callback => callback());

const columns = [{ title: 'Policy name', cellFormatters: [ expandable ]}, 'Policy Description', 'Roles', 'Last modified' ];

const GroupPolicies = ({
  match: { params: { uuid }},
  history,
  fetchGroupPolicies,
  addNotification,
  pagination,
  policies
}) => {
  const [ filterValue, setFilterValue ] = useState('');
  const [ selectedPolicies, setSelectedPolicies ] = useState([]);

  const fetchData = () => {
    if (uuid) {
      fetchGroupPolicies({ group_uuid: uuid });
    }
  };

  const routes = () => <Fragment>
    <Route path={ `/groups/detail/:uuid/policies/add_policy` }
      render={ args => <AddGroupPolicy fetchData={ fetchData } closeUrl={ `/groups/detail/${uuid}/policies` }
        postMethod={ fetchData } { ...args }/> }/>
    <Route exact path={ `/groups/detail/:uuid/policies/edit-info/:id` } render={ props => <EditPolicyInfo { ...props }
      postMethod={ fetchData } closeUrl={ `/groups/detail/${uuid}/policies` }
    /> }/>
    <Route exact path={ `/groups/detail/:uuid/policies/edit-roles/:id` } render={ props => <EditPolicyRoles { ...props }
      postMethod={ fetchData } closeUrl={ `/groups/detail/${uuid}/policies` }/>
    }/>
  </Fragment>;

  const setCheckedPolicies = (checkedPolicies) =>
    setSelectedPolicies(checkedPolicies.map(policy => policy.uuid));

  const anyPoliciesSelected = () => selectedPolicies.length > 0;

  const removePolicies = (policiesToRemove) => {
    const policyPromises = policiesToRemove.map(policy => removePolicy(policy));
    return Promise.all(policyPromises).then(() => {
      addNotification({
        variant: 'success',
        title: `Remove policy`,
        dismissable: true,
        description: `Policies were removed successfully`
      });
      fetchData();
    });
  };

  const actionResolver = (_policyData, { rowIndex }) =>
    rowIndex % 2 === 1 ? null :
      [
        {
          title: 'Edit information',
          onClick: (_event, _rowId, policy) =>
            history.push(`/groups/detail/${uuid}/policies/edit-info/${policy.uuid}`)
        },
        {
          title: 'Edit roles',
          onClick: (_event, _rowId, policy) =>
            history.push(`/groups/detail/${uuid}/policies/edit-roles/${policy.uuid}`)
        },
        {
          title: 'Delete',
          style: { color: 'var(--pf-global--danger-color--100)'	},
          onClick: (_event, _rowId, policy) => {
            removePolicies([ policy.uuid ]);
          }
        }
      ];

  const toolbarButtons = () =>
    <ToolbarGroup>
      <ToolbarItem>
        <Link to={ `/groups/detail/${uuid}/policies/add_policy` }>
          <Button
            variant="primary"
            aria-label="Add policy"
          >
          Add policy
          </Button>
        </Link>
      </ToolbarItem>
      <ToolbarItem>
        <PolicyActionsDropdown itemAction={ removePolicies }
          anyItemsSelected={ anyPoliciesSelected() }
          groupId ={ uuid }
          itemsSelected={ selectedPolicies } />
      </ToolbarItem>
    </ToolbarGroup>;

  return (
    <Fragment>
      { !uuid && <ListLoader/> }
      { uuid &&
      <Section type="content" id={ 'tab-policies' }>
        <TableToolbarView
          data={ policies }
          isSelectable={ true }
          createRows={ createRows }
          columns={ columns }
          request={ fetchGroupPolicies }
          routes={ routes }
          actionResolver={ actionResolver }
          titlePlural="policies"
          titleSingular="policy"
          pagination={ pagination }
          filterValue={ filterValue }
          setFilterValue={ (config, isDebounce) => {
            setFilterValue(config.name);
            if (isDebounce) {
              debouncedFetch(() => fetchGroupPolicies(config));
            } else {
              fetchGroupPolicies(config);
            }
          } }
          setCheckedItems={ setCheckedPolicies }
          toolbarButtons = { toolbarButtons }
        />
      </Section> }
    </Fragment>);
};

const mapStateToProps = ({ policyReducer: { policies, isLoading }}) => ({
  policies: policies.data,
  pagination: policies.meta,
  isLoading
});

const mapDispatchToProps = dispatch => ({
  fetchGroupPolicies: (apiProps) => dispatch(fetchGroupPolicies(mappedProps(apiProps))),
  addNotification: (...props) => dispatch(addNotification(...props)),
  removePolicy: (...props) => dispatch(removePolicy(...props))
}, dispatch);

GroupPolicies.propTypes = {
  history: PropTypes.shape({
    push: PropTypes.func.isRequired
  }),
  location: PropTypes.shape({
    pathname: PropTypes.string
  }),
  policies: PropTypes.array,
  isLoading: PropTypes.bool,
  fetchGroupPolicies: PropTypes.func.isRequired,
  removePolicy: PropTypes.func.isRequired,
  addNotification: PropTypes.func.isRequired,
  uuid: PropTypes.string,
  match: PropTypes.shape({
    params: PropTypes.object.isRequired }).isRequired,
  pagination: PropTypes.shape({
    limit: PropTypes.number.isRequired,
    offset: PropTypes.number.isRequired,
    count: PropTypes.number
  })
};

GroupPolicies.defaultProps = {
  policies: [],
  pagination: defaultSettings
};

export default connect(mapStateToProps, mapDispatchToProps)(GroupPolicies);
