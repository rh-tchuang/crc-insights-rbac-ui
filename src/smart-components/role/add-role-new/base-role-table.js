import React, { useState, useEffect } from 'react';
import { shallowEqual, useSelector, useDispatch } from 'react-redux';
import { Radio, Alert } from '@patternfly/react-core';
import { TableToolbarViewOld } from '../../../presentational-components/shared/table-toolbar-view-old';
import { fetchRolesForWizard } from '../../../redux/actions/role-actions';
import { mappedProps } from '../../../helpers/shared/helpers';
import useFieldApi from '@data-driven-forms/react-form-renderer/use-field-api';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import { sortable } from '@patternfly/react-table';
import { useIntl } from 'react-intl';
import messages from '../../../Messages';

const selector = ({ roleReducer: { rolesForWizard, isLoading } }) => ({
  roles: rolesForWizard.data,
  pagination: rolesForWizard.meta,
  isLoading,
});

const BaseRoleTable = (props) => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const fetchData = (options) => dispatch(fetchRolesForWizard(options));
  const [filterValue, setFilterValue] = useState('');
  const { roles, pagination } = useSelector(selector, shallowEqual);
  const { input } = useFieldApi(props);
  const formOptions = useFormApi();

  const columns = [
    '',
    { title: intl.formatMessage(messages.name), key: 'display_name', transforms: [sortable] },
    intl.formatMessage(messages.description),
  ];

  useEffect(() => {
    fetchData({
      limit: 50,
      offset: 0,
      itemCount: 0,
      orderBy: 'display_name',
    });
  }, []);

  const createRows = (roles) =>
    roles.map((role) => ({
      cells: [
        {
          title: (
            <Radio
              id={`${role.uuid}-radio`}
              name={`${role.name}-radio`}
              aria-label={`${role.name}-radio`}
              ouiaId={`${role.name}-radio`}
              value={role.uuid}
              isChecked={input.value.uuid === role.uuid}
              onChange={() => {
                formOptions.batch(() => {
                  input.onChange(role);
                  formOptions.change('role-copy-name', `Copy of ${role.display_name || role.name}`);
                  formOptions.change('role-copy-description', role.description);
                  formOptions.change('add-permissions-table', []);
                  formOptions.change('base-permissions-loaded', false);
                  formOptions.change('not-allowed-permissions', []);
                });
              }}
            />
          ),
          props: { className: 'pf-c-table__check' },
        },
        role.display_name || role.name,
        role.description,
      ],
    }));
  return (
    <div>
      <Alert variant="info" isInline title={intl.formatMessage(messages.granularPermissionsWillBeCopied)} />
      <TableToolbarViewOld
        columns={columns}
        createRows={createRows}
        data={roles}
        fetchData={(config) => fetchData(mappedProps(config))}
        filterValue={filterValue}
        setFilterValue={({ name }) => setFilterValue(name)}
        isLoading={false}
        pagination={pagination}
        titlePlural={intl.formatMessage(messages.roles)}
        titleSingular={intl.formatMessage(messages.role)}
        filterPlaceholder={intl.formatMessage(messages.roleName).toLowerCase()}
        ouiaId="roles-table"
        isCompact
        tableId="base-role"
      />
    </div>
  );
};

export default BaseRoleTable;
