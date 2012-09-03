<?php
/**
 * ownCloud - Journal
 *
 * @author Thomas Tanghus
 * @copyright 2012 Thomas Tanghus <thomas@tanghus.net>
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU AFFERO GENERAL PUBLIC LICENSE
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU AFFERO GENERAL PUBLIC LICENSE for more details.
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with this library.  If not, see <http://www.gnu.org/licenses/>.
 *
 */

namespace OCA\Journal;

/**
 * This class manages our journals
 */
class VJournal extends \OC_Calendar_Object {
	/**
	 * @brief Returns all VJOURNAL objects from a calendar
	 * @param integer $id
	 * @return array
	 *
	 * The objects are associative arrays. You'll find the original vObject in
	 * ['calendardata']
	 */
	public static function all($id){
		$stmt = \OCP\DB::prepare( 'SELECT * FROM *PREFIX*calendar_objects WHERE calendarid = ? AND objecttype = "VJOURNAL"' );
		$result = $stmt->execute(array($id));

		$calendarobjects = array();
		while( $row = $result->fetchRow()){
			$calendarobjects[] = $row;
		}

		return $calendarobjects;
	}

	/**
	 * @brief Mass updates an array of entries
	 * @param array $objects  An array of [id, journaldata].
	 */
	public static function updateDataByID($objects){
		$stmt = \OCP\DB::prepare( 'UPDATE *PREFIX*calendar_objects SET calendardata = ?, lastmodified = ? WHERE id = ?' );
		foreach($objects as $object) {
			$vevent = \OC_Calendar_App::getVCalendar($object[0]); // Get existing event.
			$vjournal = OC_VObject::parse($object[1]); // Get updated VJOURNAL part
			if(!is_null($vjournal) && !is_null($vevent)){
				try {
					$vjournal->setDateTime('LAST-MODIFIED', 'now', Sabre_VObject_Property_DateTime::UTC);
					unset($vevent->VJOURNAL); // Unset old VJOURNAL element
					$vevent->add($vjournal); // and add the updated.
					$data = $vevent->serialize();
					$result = $stmt->execute(array($data,time(),$object[0]));
				} catch(Exception $e) {
					\OCP\Util::writeLog('journal',
						__METHOD__.', exception: ' . $e->getMessage(),
						OCP\Util::ERROR
					);
					\OCP\Util::writeLog('journal', __METHOD__ . ', id: ' . $object[0], OCP\Util::DEBUG);
				}
			}
		}
	}

}
